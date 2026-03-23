import { getAllUnits, updateUnit } from "../../services/admin/adminUnitService.js";

/* GET ALL UNITS */
export const fetchAllUnits = async (req, res) => {
  try {
    const units = await getAllUnits();
    return res.status(200).json({ success: true, count: units.length, units });
  } catch (error) {
    console.error("Fetch units error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch units" });
  }
};

/* UPDATE UNIT */
export const updateUnitController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id;
    const unit = await updateUnit(id, req.body, adminId);
    return res.status(200).json({ success: true, message: "Unit updated", unit });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
