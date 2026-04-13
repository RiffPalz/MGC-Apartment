import {
  createMaintenance,
  updateMaintenance,
  getAllMaintenance,
  deleteMaintenance,
} from "../../services/caretaker/caretakerMaintenanceService.js";
import { emitEvent } from "../../utils/emitEvent.js";

export const createMaintenanceController = async (req, res) => {
  try {
    const result = await createMaintenance(req.body, req.caretaker.id);

    emitEvent(req, "maintenance_updated");

    req.app.get("io").to("admin").emit("new_notification", {
      title: "New Maintenance Request",
      message: "A caretaker submitted a maintenance request.",
      type: "maintenance",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, message: result.message, id: result.id });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMaintenanceController = async (req, res) => {
  try {
    const result = await updateMaintenance(req.params.id, req.body, req.caretaker.id);

    emitEvent(req, "maintenance_updated");

    const io = req.app.get("io");
    const targetUser = result.user_id || result.tenant_id;
    if (targetUser) {
      io.to(`user_${targetUser}`).emit("new_notification", {
        title: "Maintenance Updated",
        message: `Your maintenance request #${req.params.id} has been updated.`,
        type: "maintenance",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMaintenanceController = async (req, res) => {
  try {
    const result = await deleteMaintenance(req.params.id, req.caretaker.id);
    emitEvent(req, "maintenance_updated");
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const fetchAllMaintenanceController = async (req, res) => {
  try {
    const data = await getAllMaintenance();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch maintenance requests" });
  }
};
