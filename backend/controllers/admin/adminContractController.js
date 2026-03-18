import {
    createContractByAdmin,
    terminateContract,
    renewContract,
    editContract,
    getAdminDashboardData,
    getExpiringContracts,
    completeContract
} from "../../services/admin/adminContractService.js";

// Create a new contract and link tenants
export const createContractAdmin = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.auth?.id;
        const { unit_id, rent_amount, start_date, end_date, status, tenancy_rules, termination_renewal_conditions, tenantIds } = req.body;
        const contract_file = req.file ? req.file.path : null;

        const contract = await createContractByAdmin({
            unit_id,
            rent_amount: Number(rent_amount),
            start_date,
            end_date,
            status,
            tenancy_rules,
            termination_renewal_conditions,
            tenantIds: JSON.parse(tenantIds),
            contract_file,
        }, adminId); // Pass Admin ID

        return res.status(201).json({ message: "Contract created successfully.", contract });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Cancel an active contract immediately
export const terminateContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;

        const contract = await terminateContract(id, adminId); // Pass Admin ID

        return res.status(200).json({ message: "Contract terminated successfully.", contract });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Create a new contract based on an existing one
export const renewContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;
        const { newStartDate, newEndDate } = req.body;
        const contract_file = req.file ? req.file.path : null;

        const newContract = await renewContract({
            oldContractId: id,
            newStartDate,
            newEndDate,
            contract_file,
        }, adminId); // Pass Admin ID

        return res.status(201).json({ message: "Contract renewed successfully.", contract: newContract });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Update existing contract details or files
export const editContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;
        const updates = { ...req.body };

        if (req.file) updates.contract_file = req.file.path;

        const updatedContract = await editContract(id, updates, adminId); // Pass Admin ID

        return res.status(200).json({ message: "Contract updated successfully.", contract: updatedContract });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Get general stats for the admin dashboard
export const getAdminDashboard = async (req, res) => {
    try {
        const data = await getAdminDashboardData();
        return res.status(200).json({ success: true, ...data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// List contracts that are nearing their end date
export const getExpiringContractsAdmin = async (req, res) => {
    try {
        const contracts = await getExpiringContracts();
        return res.status(200).json({ success: true, count: contracts.length, contracts });
    } catch (error) {
        console.error("Expiring contract error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Mark a contract as fully completed
export const completeContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;

        const contract = await completeContract(id, adminId); // Pass Admin ID

        return res.status(200).json({ message: "Contract completed successfully.", contract });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};