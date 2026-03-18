import {
  createMaintenance,
  updateMaintenance,
  getAllMaintenance,
  deleteMaintenance
} from "../../services/caretaker/caretakerMaintenanceService.js";


// Create maintenance request
export const createMaintenanceController = async (req, res) => {
  try {

    const caretakerId = req.caretaker.id;

    const result = await createMaintenance(req.body, caretakerId);

    return res.status(201).json({
      success: true,
      message: result.message,
      id: result.id
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};


// Update maintenance status
export const updateMaintenanceController = async (req, res) => {
  try {

    const { id } = req.params;
    const caretakerId = req.caretaker.id;

    const result = await updateMaintenance(id, req.body, caretakerId);

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


// Delete maintenance request
export const deleteMaintenanceController = async (req, res) => {
  try {

    const { id } = req.params;
    const caretakerId = req.caretaker.id;

    const result = await deleteMaintenance(id, caretakerId);

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


// Get all maintenance records
export const fetchAllMaintenanceController = async (req, res) => {
  try {

    const data = await getAllMaintenance();

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {

    console.error("Fetch maintenance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance requests"
    });

  }
};