import {
  getAllMaintenance,
  approveMaintenance,
  updateMaintenance,
  createMaintenance as createMaintenanceService,
  deleteMaintenance
} from "../../services/admin/adminMaintenanceService.js";

export const createMaintenanceController = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.auth?.id;
    const result = await createMaintenanceService(req.body, adminId); // Pass Admin ID

    return res.status(201).json({ success: true, message: result.message, id: result.id });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * APPROVE MAINTENANCE REQUEST
 */
export const approveMaintenanceController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    const result = await approveMaintenance(id, adminId); // Pass Admin ID

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE MAINTENANCE STATUS
 */
export const updateMaintenanceController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    const result = await updateMaintenance(id, req.body, adminId); // Pass Admin ID

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * DELETE MAINTENANCE 
 */
export const deleteMaintenanceController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    const result = await deleteMaintenance(id, adminId); // Pass Admin ID

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL MAINTENANCE REQUESTS
 */
export const fetchAllMaintenance = async (req, res) => {
  try {
    const result = await getAllMaintenance();
    return res.status(200).json({ success: true, count: result.length, requests: result });
  } catch (error) {
    console.error("Fetch maintenance error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch maintenance requests" });
  }
};