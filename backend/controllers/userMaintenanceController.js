import {
  createMaintenance, getTenantMaintenance, followUpMaintenance,
} from "../services/userMaintenanceService.js";
import { emitEvent } from "../utils/emitEvent.js";

export const createMaintenanceRequest = async (req, res) => {
  try {
    const result = await createMaintenance(req.auth.id, req.body);
    emitEvent(req, "maintenance_updated");
    return res.status(201).json({ success: true, message: "Maintenance request submitted successfully", request: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const followUpMaintenanceRequest = async (req, res) => {
  try {
    const result = await followUpMaintenance(req.auth.id, req.params.id);
    emitEvent(req, "maintenance_updated");
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyMaintenanceRequests = async (req, res) => {
  try {
    const result = await getTenantMaintenance(req.auth.id);
    return res.status(200).json({ success: true, count: result.length, requests: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch maintenance requests" });
  }
};