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
import { generateTerminationPdf } from "./contractPdfService.js";

const getWorkingPdfUrl = (storedUrl) => storedUrl || null;

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
            description: `You created a contract for Unit ${unit.unit_number}.`,
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

        const today = new Date().toISOString().split("T")[0];

        await contract.update({ status: "Terminated", termination_date: today }, { transaction });
        for (const tenant of contract.tenants) {
            await tenant.update({ unitNumber: null }, { transaction });
        }

        await transaction.commit();

        // Generate termination PDF (outside transaction — Cloudinary upload)
        try {
            const tenantNames = contract.tenants.map((t) => t.fullName).join(" & ");
            const tenantAddress = contract.tenants[0]?.address || "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna";
            const terminationPdfUrl = await generateTerminationPdf({
                unit_number: contract.unit?.unit_number,
                lessee_name: tenantNames,
                lessee_address: tenantAddress,
                original_contract_date: contract.start_date,
                termination_effective_date: today,
            });
            await contract.update({ termination_pdf: terminationPdfUrl });
        } catch (pdfErr) {
            console.error("[Termination PDF] Failed to generate:", pdfErr.message);
        }

        for (const tenant of contract.tenants) {
            await createNotification({
                userId: tenant.ID,
                role: "tenant",
                type: "contract terminated",
                title: "Contract Terminated",
                message: "Your contract has been terminated. You have 3 days to access your account.",
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
            description: `You terminated the contract for Unit ${contract.unit?.unit_number ?? "—"}.`,
            referenceId: contract.ID,
            referenceType: "contract",
        });

        return contract;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/* RENEW CONTRACT — updates dates on the existing active contract and regenerates PDF */
export const renewContract = async ({ contractId, newStartDate, newEndDate }, adminId) => {
    const contract = await Contract.findByPk(contractId, {
        include: [
            { model: User, as: "tenants" },
            { model: Unit, as: "unit" },
        ],
    });
    if (!contract) throw new Error("Contract not found.");
    if (contract.status !== "Active") throw new Error("Only active contracts can be renewed.");
    if (new Date(newEndDate) <= new Date(newStartDate)) throw new Error("End date must be after start date.");

    await contract.update({ start_date: newStartDate, end_date: newEndDate });

    for (const tenant of contract.tenants) {
        await createNotification({
            userId: tenant.ID,
            role: "tenant",
            type: "contract renewed",
            title: "Contract Renewed",
            message: `Your contract has been renewed until ${new Date(newEndDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}.`,
            referenceId: contract.ID,
            referenceType: "contract",
        });
    }

    sendSMSBulk(
        contract.tenants.map((t) => t.contactNumber),
        sms.contractRenewed(contract.unit.unit_number, newEndDate)
    );

    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "RENEW CONTRACT",
        description: `You renewed the contract for Unit ${contract.unit.unit_number} until ${new Date(newEndDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}.`,
        referenceId: contract.ID,
        referenceType: "contract",
    });

    return contract;
};

/* EDIT CONTRACT — dates are read-only, only other fields can be updated */
export const editContract = async (contractId, updates, adminId) => {
    const contract = await Contract.findByPk(contractId, {
        include: [
            { model: Unit, as: "unit", attributes: ["unit_number"] },
            { model: User, as: "tenants", attributes: ["ID", "contactNumber"], through: { attributes: [] } },
        ],
    });
    if (!contract) throw new Error("Contract not found.");

    // Strip date fields — dates are managed via renew only
    const { start_date, end_date, ...safeUpdates } = updates;

    await contract.update(safeUpdates);

    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "EDIT CONTRACT",
        description: `You edited the contract for Unit ${contract.unit?.unit_number ?? "—"}.`,
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
        attributes: ["ID", "unitNumber", "numberOfTenants"],
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

    // Map unit_number → numberOfTenants for "Ready" units
    const unitTenantCountMap = {};
    tenantsWithUnit
        .filter((u) => !u.contracts || u.contracts.length === 0)
        .forEach((u) => { unitTenantCountMap[u.unitNumber] = u.numberOfTenants; });

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
                numberOfTenants: unitTenantCountMap[u.unit_number] ?? null,
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
            contract_file_download: getWorkingPdfUrl(c.contract_file),
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
        const contract = await Contract.findByPk(contractId, {
            include: [
                { model: User, as: "tenants" },
                { model: Unit, as: "unit", attributes: ["unit_number"] },
            ],
            transaction,
        });
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
            description: `You marked the contract for Unit ${contract.unit?.unit_number ?? "—"} as completed.`,
            referenceId: contract.ID,
            referenceType: "contract",
        });

        return contract;

    } catch (error) {

        await transaction.rollback();
        throw error;
    }
};