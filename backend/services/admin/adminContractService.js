import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import Unit from "../../models/unit.js";
import Contract from "../../models/contract.js";
import ContractTenant from "../../models/contractTenant.js";
import User from "../../models/user.js";
import cloudinary from "../../config/cloudinary.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { sendSMSBulk } from "../../utils/sms.js";
import { sms } from "../../utils/smsTemplates.js";

const getWorkingPdfUrl = (storedUrl, forDownload = false) => {
  if (!storedUrl) return null;
  try {
    const match = storedUrl.match(/\/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return storedUrl;
    return cloudinary.url(match[1], {
      resource_type: "raw",
      secure: true,
      ...(forDownload ? { flags: "attachment" } : {}),
    });
  } catch {
    return storedUrl;
  }
};

/* CREATE CONTRACT */
export const createContractByAdmin = async (
    { unit_id,
        rent_amount,
        start_date,
        end_date, status,
        tenancy_rules,
        termination_renewal_conditions,
        contract_file
    },
    adminId
) => {
    const transaction = await sequelize.transaction();
    try {
        // Validate unit
        const unit = await Unit.findByPk(unit_id, { transaction });
        if (!unit || !unit.is_active) throw new Error("Unit not found or inactive.");
        if (new Date(end_date) <= new Date(start_date)) throw new Error("Invalid dates.");
        if (isNaN(rent_amount) || Number(rent_amount) <= 0) throw new Error("Invalid rent.");

        // Check unit not already under active contract
        if (status === "Active") {
            const unitActive = await Contract.findOne({ where: { unit_id, status: "Active" }, transaction });
            if (unitActive) throw new Error("Unit already has an active contract.");
        }

        // Auto-resolve tenants: approved users who registered with this unit number and have no active contract
        const candidates = await User.findAll({
            where: { role: "tenant", status: "Approved", unitNumber: unit.unit_number },
            include: [{
                model: Contract,
                as: "contracts",
                where: { status: "Active" },
                required: false,
            }],
            transaction,
        });

        const tenantIds = candidates
            .filter((u) => !u.contracts || u.contracts.length === 0)
            .map((u) => u.ID);

        if (!tenantIds.length) throw new Error("No approved tenants found for this unit. Make sure tenants have registered with this unit number.");
        if (tenantIds.length > unit.max_capacity) throw new Error(`Too many tenants for this unit (max ${unit.max_capacity}).`);

        // Create contract
        const contract = await Contract.create(
            { unit_id, rent_amount, start_date, end_date, status, tenancy_rules, termination_renewal_conditions, contract_file },
            { transaction }
        );

        for (const userId of tenantIds) {
            await ContractTenant.create({ contract_id: contract.ID, user_id: userId }, { transaction });
            if (status === "Active") {
                await User.update({ unitNumber: unit.unit_number }, { where: { ID: userId }, transaction });
            }
        }

        await transaction.commit();

        // Notifications and logs
        for (const userId of tenantIds) {
            await createNotification({
                userId,
                role: "tenant",
                type: "contract created",
                title: "New Contract Uploaded",
                message: "Your tenancy contract is available.",
                referenceId: contract.ID,
                referenceType: "contract",
            });
        }

        // SMS → all tenants on this contract
        const tenantContacts = candidates
            .filter((u) => tenantIds.includes(u.ID))
            .map((u) => u.contactNumber);
        sendSMSBulk(tenantContacts, sms.contractCreated(unit.unit_number));

        // If a PDF was already attached at creation, send the file-uploaded SMS too
        if (contract_file) {
            sendSMSBulk(tenantContacts, sms.contractFileUploaded(unit.unit_number));
        }

        await createActivityLog({
            userId: adminId,
            role: "admin",
            action: "CREATE CONTRACT",
            description: `Created contract for unit ${unit.unit_number}`,
            referenceId: contract.ID,
            referenceType: "contract",
        });

        return contract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/* TERMINATE CONTRACT */
export const terminateContract = async (contractId, adminId) => {
    const transaction = await sequelize.transaction();
    try {
        const contract = await Contract.findByPk(contractId, {
            include: [
                { model: User, as: "tenants" },
                { model: Unit, as: "unit", attributes: ["unit_number"] },
            ],
            transaction,
        });
        if (!contract || contract.status !== "Active") throw new Error("Contract not eligible for termination.");

        await contract.update({ status: "Terminated" }, { transaction });
        for (const tenant of contract.tenants) {
            await tenant.update({ unitNumber: null }, { transaction });
        }

        await transaction.commit();

        for (const tenant of contract.tenants) {
            await createNotification({
                userId: tenant.ID,
                role: "tenant",
                type: "contract terminated",
                title: "Contract Terminated",
                message: "Your contract has ended.",
                referenceId: contract.ID,
                referenceType: "contract",
            });
        }

        // SMS → tenants
        sendSMSBulk(contract.tenants.map((t) => t.contactNumber), sms.contractTerminated(contract.unit?.unit_number ?? ""));

        await createActivityLog({
            userId: adminId,
            role: "admin",
            action: "TERMINATE CONTRACT",
            description: `Terminated contract ID ${contract.ID}`,
            referenceId: contract.ID,
            referenceType: "contract",
        });

        return contract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/* RENEW CONTRACT */
export const renewContract = async ({ oldContractId, newStartDate, newEndDate, contract_file }, adminId) => {
    const transaction = await sequelize.transaction();
    try {
        const oldContract = await Contract.findByPk(oldContractId, {
            include: [{ model: User, as: "tenants" }, { model: Unit, as: "unit" }],
            transaction,
        });
        if (!oldContract || oldContract.status === "Active") throw new Error("Cannot renew an active contract.");

        const newContract = await Contract.create(
            {
                unit_id: oldContract.unit_id,
                start_date: newStartDate,
                end_date: newEndDate,
                status: "Active",
                tenancy_rules: oldContract.tenancy_rules,
                termination_renewal_conditions: oldContract.termination_renewal_conditions,
                contract_file,
            },
            { transaction }
        );

        for (const tenant of oldContract.tenants) {
            await ContractTenant.create({ contract_id: newContract.ID, user_id: tenant.ID }, { transaction });
            await tenant.update({ unitNumber: oldContract.unit.unit_number }, { transaction });
        }

        await transaction.commit();

        for (const tenant of oldContract.tenants) {
            await createNotification({
                userId: tenant.ID,
                role: "tenant",
                type: "contract renewed",
                title: "Contract Renewed",
                message: "Your contract has been renewed.",
                referenceId: newContract.ID,
                referenceType: "contract",
            });
        }

        // SMS → tenants
        sendSMSBulk(
            oldContract.tenants.map((t) => t.contactNumber),
            sms.contractRenewed(oldContract.unit.unit_number, newEndDate)
        );

        await createActivityLog({
            userId: adminId,
            role: "admin",
            action: "RENEW CONTRACT",
            description: `Renewed contract. New ID: ${newContract.ID}`,
            referenceId: newContract.ID,
            referenceType: "contract",
        });

        return newContract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/* EDIT CONTRACT */
export const editContract = async (contractId, updates, adminId) => {
    const contract = await Contract.findByPk(contractId, {
        include: [
            { model: Unit, as: "unit", attributes: ["unit_number"] },
            { model: User, as: "tenants", attributes: ["ID", "contactNumber"], through: { attributes: [] } },
        ],
    });
    if (!contract) throw new Error("Contract not found.");

    const hadFile = !!contract.contract_file;
    await contract.update(updates);

    // If a new PDF was just attached, notify tenants via SMS
    if (updates.contract_file && !hadFile) {
        sendSMSBulk(
            contract.tenants.map((t) => t.contactNumber),
            sms.contractFileUploaded(contract.unit?.unit_number ?? "")
        );
    }

    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "EDIT CONTRACT",
        description: `Edited contract ID ${contract.ID}`,
        referenceId: contract.ID,
        referenceType: "contract",
    });

    return contract;
};

/* ADMIN DASHBOARD DATA */
export const getAdminDashboardData = async () => {
    const units = await Unit.findAll({
        include: [
            {
                model: Contract,
                as: "contracts",
                where: { status: "Active" },
                required: false,
                include: [{ model: User, as: "tenants", attributes: ["ID", "fullName", "emailAddress"] }],
            },
        ],
        order: [["unit_number", "ASC"]],
    });

    // Find unit numbers that have approved tenants registered but no active contract
    const tenantsWithUnit = await User.findAll({
        where: { role: "tenant", status: "Approved", unitNumber: { [Op.ne]: null } },
        attributes: ["ID", "unitNumber"],
        include: [{
            model: Contract,
            as: "contracts",
            where: { status: "Active" },
            required: false,
        }],
    });

    const readyUnitNumbers = new Set(
        tenantsWithUnit
            .filter((u) => !u.contracts || u.contracts.length === 0)
            .map((u) => u.unitNumber)
    );

    const contracts = await Contract.findAll({
        include: [
            { model: Unit, as: "unit", attributes: ["ID", "unit_number"] },
            { model: User, as: "tenants", attributes: ["ID", "fullName", "emailAddress"] },
        ],
        order: [["created_at", "DESC"]],
    });

    return {
        units: units.map((u) => {
            const hasActiveContract = u.contracts.length > 0;
            const hasReadyTenant = readyUnitNumbers.has(u.unit_number);
            let status = "Vacant";
            if (hasActiveContract) status = "Occupied";
            else if (hasReadyTenant) status = "Ready";
            return {
                ID: u.ID,
                unit_number: u.unit_number,
                floor: u.floor,
                max_capacity: u.max_capacity,
                status,
                contract: u.contracts[0] || null,
            };
        }),
        contracts: contracts.map((c) => ({
            ID: c.ID,
            unit_number: c.unit.unit_number,
            unit_id: c.unit_id,
            start_date: c.start_date,
            end_date: c.end_date,
            rent_amount: c.rent_amount,
            status: c.status,
            tenancy_rules: c.tenancy_rules,
            termination_renewal_conditions: c.termination_renewal_conditions,
            contract_file: getWorkingPdfUrl(c.contract_file),
            contract_file_download: getWorkingPdfUrl(c.contract_file, true),
            tenants: c.tenants,
        })),
    };
};

/* GET EXPIRING CONTRACTS */
export const getExpiringContracts = async () => {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const contracts = await Contract.findAll({
        where: {
            status: "Active",
            end_date: { [Op.between]: [today.toISOString().split("T")[0], next30Days.toISOString().split("T")[0]] },
        },
        include: [
            { model: Unit, as: "unit", attributes: ["unit_number", "floor"] },
            { model: User, as: "tenants", attributes: ["ID", "fullName", "emailAddress"] },
        ],
        order: [["end_date", "ASC"]],
    });

    return contracts.map((c) => {
        const diffTime = new Date(c.end_date) - today;
        return { ...c.toJSON(), daysRemaining: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) };
    });
};

/* COMPLETE CONTRACT */
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
                userId: tenant.ID,
                role: "tenant",
                type: "contract completed",
                title: "Contract Completed",
                message: "Your contract is marked as completed.",
                referenceId: contract.ID,
                referenceType: "contract",
            });
        }

        await createActivityLog({
            userId: adminId,
            role: "admin",
            action: "COMPLETE CONTRACT",
            description: `Completed contract ID ${contract.ID}`,
            referenceId: contract.ID,
            referenceType: "contract",
        });

        return contract;
    
    } catch (error) {
    
        await transaction.rollback();
        throw error;
    }
};