import {
  createMaintenance,
  getTenantMaintenance,
  followUpMaintenance,
  editMaintenance,
} from "../services/userMaintenanceService.js";
import { emitEvent } from "../utils/emitEvent.js";

// Create request + notify admin/caretaker
export const createMaintenanceRequest = async (req, res) => {
  try {
    const result = await createMaintenance(req.auth.id, req.body);

    emitEvent(req, "maintenance_updated");

    // Send notification
    const io = req.app.get("io");
    const payload = {
      title: "New Maintenance Request",
      message: "A tenant submitted a maintenance request.",
      type: "maintenance",
      is_read: false,
      created_at: new Date().toISOString()
    };

    io.to("admin").emit("new_notification", payload);
    io.to("caretaker").emit("new_notification", payload);

    return res.status(201).json({
      success: true,
      message: "Maintenance request submitted successfully",
      request: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Follow up request
export const followUpMaintenanceRequest = async (req, res) => {
  try {
    const result = await followUpMaintenance(req.auth.id, req.params.id);

    emitEvent(req, "maintenance_updated");

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Edit maintenance request
export const editMaintenanceRequest = async (req, res) => {
  try {
    const result = await editMaintenance(req.auth.id, req.params.id, req.body);

    emitEvent(req, "maintenance_updated");

    const io = req.app.get("io");
    const payload = {
      title: "Maintenance Request Edited",
      message: "A tenant edited a maintenance request.",
      type: "maintenance",
      is_read: false,
      created_at: new Date().toISOString()
    };

    io.to("admin").emit("new_notification", payload);
    io.to("caretaker").emit("new_notification", payload);

    return res.status(200).json({
      success: true,
      request: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's maintenance requests
export const getMyMaintenanceRequests = async (req, res) => {
  try {
    const result = await getTenantMaintenance(req.auth.id);

    return res.status(200).json({
      success: true,
      count: result.length,
      requests: result
    });

  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance requests"
    });
  }
};