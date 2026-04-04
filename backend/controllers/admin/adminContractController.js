import {
    createContractByAdmin, terminateContract, renewContract,
    editContract, getAdminDashboardData, getExpiringContracts, completeContract
} from "../../services/admin/adminContractService.js";
import { generateContractPdf } from "../../services/admin/contractPdfService.js";
import Contract from "../../models/contract.js";
import User from "../../models/user.js";
import Unit from "../../models/unit.js";
import { emitEvent } from "../../utils/emitEvent.js";

// Create a new contract and link tenants
export const createContractAdmin = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.auth?.id;
        const { unit_id } = req.params;
        const {
            rent_amount,
            start_date,
            end_date, status,
            tenancy_rules,
            termination_renewal_conditions,
        } = req.body;

        const contract_file = req.file ? (req.file.secure_url || req.file.path) : null;

        const contract = await createContractByAdmin({
            unit_id,
            rent_amount: Number(rent_amount),
            start_date,
            end_date,
            status,
            tenancy_rules,
            termination_renewal_conditions,
            contract_file,
        }, adminId);
        emitEvent(req, "contract_updated");
        return res.status(201).json({ success: true, message: "Contract created successfully.", contract });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Cancel an active contract immediately
export const terminateContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;
        const contract = await terminateContract(id, adminId);
        emitEvent(req, "contract_updated");
        return res.status(200).json({ success: true, message: "Contract terminated successfully.", contract });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Renew an active contract — updates dates and regenerates PDF
export const renewContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;
        const { newStartDate, newEndDate } = req.body;

        const contract = await renewContract({ contractId: id, newStartDate, newEndDate }, adminId);

        // Auto-regenerate PDF with updated dates
        const fullContract = await Contract.findByPk(contract.ID, {
            include: [{ model: Unit, as: "unit" }, { model: User, as: "tenants" }],
        });

        const tenantNames = fullContract.tenants.map((t) => t.fullName).join(" & ");
        const tenantAddress = fullContract.tenants[0]?.address || "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna";

        const pdfUrl = await generateContractPdf({
            unit_number: fullContract.unit.unit_number,
            lessee_name: tenantNames,
            lessee_address: tenantAddress,
            start_date: fullContract.start_date,
            end_date: fullContract.end_date,
            rent_amount: fullContract.rent_amount,
            tenancy_rules: fullContract.tenancy_rules,
            termination_renewal_conditions: fullContract.termination_renewal_conditions,
            execution_date: newStartDate,
        });

        await fullContract.update({ contract_file: pdfUrl });
        emitEvent(req, "contract_updated");
        return res.status(200).json({
            success: true,
            message: "Contract renewed and PDF regenerated successfully.",
            contract: { ...fullContract.toJSON(), contract_file: pdfUrl },
        });

    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Update existing contract details or files
export const editContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;
        const updates = { ...req.body };

        if (req.file) updates.contract_file = req.file.secure_url || req.file.path;

        const updatedContract = await editContract(id, updates, adminId);
        emitEvent(req, "contract_updated");
        return res.status(200).json({ success: true, message: "Contract updated successfully.", contract: updatedContract });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get general stats for the admin dashboard
export const getAdminDashboard = async (req, res) => {
    try {
        const data = await getAdminDashboardData();
        return res.status(200).json({
            success: true,
            ...data
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// List contracts that are nearing their end date
export const getExpiringContractsAdmin = async (req, res) => {
    try {
        const contracts = await getExpiringContracts();
        return res.status(200).json({
            success: true,
            count: contracts.length,
            contracts
        });

    } catch (error) {
        console.error("Expiring contract error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark a contract as fully completed
export const completeContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?.id || req.auth?.id;

        const contract = await completeContract(id, adminId);
        emitEvent(req, "contract_updated");
        return res.status(200).json({ success: true, message: "Contract completed successfully.", contract });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Generate a PDF contract and store it on Cloudinary
export const generateContractPdfAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const contract = await Contract.findByPk(id, {
            include: [
                { model: Unit, as: "unit" },
                { model: User, as: "tenants" },
            ],
        });

        if (!contract) return res.status(404).json({ success: false, message: "Contract not found." });

        const tenantNames = contract.tenants.map((t) => t.fullName).join(" & ");
        const tenantAddress = contract.tenants[0]?.address || "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna";

        const pdfUrl = await generateContractPdf({
            unit_number: contract.unit.unit_number,
            lessee_name: tenantNames,
            lessee_address: tenantAddress,
            start_date: contract.start_date,
            end_date: contract.end_date,
            rent_amount: contract.rent_amount,
            tenancy_rules: contract.tenancy_rules,
            termination_renewal_conditions: contract.termination_renewal_conditions,
            execution_date: contract.start_date,
        });

        await contract.update({ contract_file: pdfUrl });

        return res.status(200).json({
            success: true,
            message: "Contract PDF generated successfully.",
            contract_file: pdfUrl,
        });
    } catch (error) {
        console.error("PDF generation error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Permanently delete a contract
export const deleteContractAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.findByPk(id);
        if (!contract) return res.status(404).json({ success: false, message: "Contract not found." });
        await contract.destroy();
        return res.status(200).json({ success: true, message: "Contract deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
