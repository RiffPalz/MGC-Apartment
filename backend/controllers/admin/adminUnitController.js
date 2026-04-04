import { getAllUnits, createUnit, updateUnit, deleteUnit } from "../../services/admin/adminUnitService.js";
import { emitEvent } from "../../utils/emitEvent.js";

export const fetchAllUnits = async (req, res) => {
  try {
    const units = await getAllUnits();
    return res.status(200).json({ success: true, count: units.length, units });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch units" });
  }
};

export const createUnitController = async (req, res) => {
  try {
    const unit = await createUnit(req.body, req.admin?.id);
    emitEvent(req, "units_updated");
    return res.status(201).json({ success: true, message: "Unit created", unit });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUnitController = async (req, res) => {
  try {
    const unit = await updateUnit(req.params.id, req.body, req.admin?.id);
    emitEvent(req, "units_updated");
    return res.status(200).json({ success: true, message: "Unit updated", unit });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUnitController = async (req, res) => {
  try {
    await deleteUnit(req.params.id, req.admin?.id);
    emitEvent(req, "units_updated");
    return res.status(200).json({ success: true, message: "Unit deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
