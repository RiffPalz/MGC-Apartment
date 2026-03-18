import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import Unit from "../../models/unit.js";
import Contract from "../../models/contract.js";
import ContractTenant from "../../models/contractTenant.js";
import User from "../../models/user.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";

// Create a new contract with validation, tenant linking, and notifications
export const createContractByAdmin = async ({
    unit_id,
    rent_amount,
    start_date,
    end_date,
    status,
    tenancy_rules,
    termination_renewal_conditions,
    tenantIds,
    contract_file,
}, adminId) => {
    const transaction = await sequelize.transaction();

    try {
        // 1. Validations: Check unit existence, dates, rent, and capacity
        const unit = await Unit.findByPk(unit_id, { transaction });
        if (!unit || !unit.is_active) throw new Error("Unit not found or inactive.");
        if (new Date(end_date) <= new Date(start_date)) throw new Error("Invalid dates.");
        if (isNaN(rent_amount) || Number(rent_amount) <= 0) throw new Error("Invalid rent.");
        if (!tenantIds?.length) throw new Error("At least one tenant is required.");
        if (tenantIds.length > unit.max_capacity) throw new Error(`Max ${unit.max_capacity} tenants.`);

        // 2. Conflict Checks: Ensure tenants and units don't have overlapping active contracts
        const existingActive = await Contract.findOne({
            include: { model: User, as: "tenants", where: { ID: { [Op.in]: tenantIds } } },
            where: { status: "Active" },
            transaction,
        });
        if (existingActive) throw new Error("A tenant already has an active contract.");

        if (status === "Active") {
            const unitActive = await Contract.findOne({ where: { unit_id, status: "Active" }, transaction });
            if (unitActive) throw new Error("Unit already occupied.");
        }

        // 3. Execution: Create contract and link tenants
        const contract = await Contract.create({
            unit_id, rent_amount, start_date, end_date, status,
            tenancy_rules, termination_renewal_conditions, contract_file,
        }, { transaction });

        for (const userId of tenantIds) {
            await ContractTenant.create({ contract_id: contract.ID, user_id: userId }, { transaction });

            // Assign unit number to tenant profile if contract is active
            if (status === "Active") {
                await User.update({ unitNumber: unit.unit_number }, { where: { ID: userId }, transaction });
            }
        }

        await transaction.commit();

        // 4. Post-Process: Notify tenants and log admin activity
        for (const userId of tenantIds) {
            await createNotification({
                userId, role: "tenant", type: "contract_created",
                title: "New Contract Uploaded", message: "Your tenancy contract is available.",
                referenceId: contract.ID, referenceType: "contract"
            });
        }

        await createActivityLog({
            userId: adminId, role: "admin", action: "CREATE_CONTRACT",
            description: `Created contract for unit ${unit.unit_number}`,
            referenceId: contract.ID, referenceType: "contract"
        });

        return contract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// End a contract and remove unit assignments from tenants
export const terminateContract = async (contractId, adminId) => {
    const transaction = await sequelize.transaction();
    try {
        const contract = await Contract.findByPk(contractId, { include: { model: User, as: "tenants" }, transaction });
        if (!contract || contract.status !== "Active") throw new Error("Contract not eligible for termination.");

        await contract.update({ status: "Terminated" }, { transaction });
        for (const tenant of contract.tenants) {
            await tenant.update({ unitNumber: null }, { transaction });
        }

        await transaction.commit();

        // Notify tenants and log action
        for (const tenant of contract.tenants) {
            await createNotification({
                userId: tenant.ID, role: "tenant", type: "contract_terminated",
                title: "Contract Terminated", message: "Your contract has ended.",
                referenceId: contract.ID, referenceType: "contract"
            });
        }

        await createActivityLog({
            userId: adminId, role: "admin", action: "TERMINATE_CONTRACT",
            description: `Terminated contract ID ${contract.ID}`,
            referenceId: contract.ID, referenceType: "contract"
        });

        return contract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Create a new contract based on an expired/terminated one
export const renewContract = async ({ oldContractId, newStartDate, newEndDate, contract_file }, adminId) => {
    const transaction = await sequelize.transaction();
    try {
        const oldContract = await Contract.findByPk(oldContractId, { include: [{ model: User, as: "tenants" }, { model: Unit, as: "unit" }], transaction });
        if (!oldContract || oldContract.status === "Active") throw new Error("Cannot renew an active contract.");

        const newContract = await Contract.create({
            unit_id: oldContract.unit_id, start_date: newStartDate, end_date: newEndDate,
            status: "Active", tenancy_rules: oldContract.tenancy_rules,
            termination_renewal_conditions: oldContract.termination_renewal_conditions, contract_file,
        }, { transaction });

        for (const tenant of oldContract.tenants) {
            await ContractTenant.create({ contract_id: newContract.ID, user_id: tenant.ID }, { transaction });
            await tenant.update({ unitNumber: oldContract.unit.unit_number }, { transaction });
        }

        await transaction.commit();

        // Notifications and Logs
        for (const tenant of oldContract.tenants) {
            await createNotification({
                userId: tenant.ID, role: "tenant", type: "contract_renewed",
                title: "Contract Renewed", message: "Your contract has been renewed.",
                referenceId: newContract.ID, referenceType: "contract"
            });
        }

        await createActivityLog({
            userId: adminId, role: "admin", action: "RENEW_CONTRACT",
            description: `Renewed contract. New ID: ${newContract.ID}`,
            referenceId: newContract.ID, referenceType: "contract"
        });

        return newContract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Update existing contract details and log the edit
export const editContract = async (contractId, updates, adminId) => {
    const contract = await Contract.findByPk(contractId);
    if (!contract) throw new Error("Contract not found.");

    await contract.update(updates);
    await createActivityLog({
        userId: adminId, role: "admin", action: "EDIT_CONTRACT",
        description: `Edited contract ID ${contract.ID}`,
        referenceId: contract.ID, referenceType: "contract"
    });

    return contract;
};

// Fetch summaries of all units and contracts for the admin view
export const getAdminDashboardData = async () => {
    const units = await Unit.findAll({
        include: [{ model: Contract, as: "contracts", where: { status: "Active" }, required: false, include: [{ model: User, as: "tenants", attributes: ["ID", "fullName", "emailAddress"] }] }],
        order: [["unit_number", "ASC"]],
    });

    const contracts = await Contract.findAll({
        include: [{ model: Unit, as: "unit", attributes: ["ID", "unit_number"] }, { model: User, as: "tenants", attributes: ["ID", "fullName", "emailAddress"] }],
        order: [["created_at", "DESC"]],
    });

    return {
        units: units.map(u => ({
            ID: u.ID, unit_number: u.unit_number, floor: u.floor, max_capacity: u.max_capacity,
            status: u.contracts.length > 0 ? "Occupied" : "Vacant", contract: u.contracts[0] || null,
        })),
        contracts: contracts.map(c => ({
            ID: c.ID, unit_number: c.unit.unit_number, start_date: c.start_date, end_date: c.end_date,
            status: c.status, tenants: c.tenants,
        }))
    };
};

// Find active contracts ending within the next 30 days
export const getExpiringContracts = async () => {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const contracts = await Contract.findAll({
        where: { status: "Active", end_date: { [Op.between]: [today.toISOString().split("T")[0], next30Days.toISOString().split("T")[0]] } },
        include: [{ model: Unit, as: "unit", attributes: ["unit_number", "floor"] }, { model: User, as: "tenants", attributes: ["ID", "fullName", "emailAddress"] }],
        order: [["end_date", "ASC"]],
    });

    return contracts.map(c => {
        const diffTime = new Date(c.end_date) - today;
        return { ...c.toJSON(), daysRemaining: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) };
    });
};

// Mark a contract as successfully completed and free up the unit
export const completeContract = async (contractId, adminId) => {
    const transaction = await sequelize.transaction();
    try {
        const contract = await Contract.findByPk(contractId, { include: { model: User, as: "tenants" }, transaction });
        if (!contract || contract.status !== "Active") throw new Error("Contract not eligible for completion.");

        await contract.update({ status: "Completed" }, { transaction });
        for (const tenant of contract.tenants) {
            await tenant.update({ unitNumber: null }, { transaction });
        }

        await transaction.commit();

        for (const tenant of contract.tenants) {
            await createNotification({
                userId: tenant.ID, role: "tenant", type: "contract_completed",
                title: "Contract Completed", message: "Your contract is marked as completed.",
                referenceId: contract.ID, referenceType: "contract"
            });
        }

        await createActivityLog({
            userId: adminId, role: "admin", action: "COMPLETE_CONTRACT",
            description: `Completed contract ID ${contract.ID}`,
            referenceId: contract.ID, referenceType: "contract"
        });

        return contract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};