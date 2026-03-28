import { caretakerLogin } from "../../services/caretaker/caretakerAuthService.js";
import User from "../../models/user.js";
import Unit from "../../models/unit.js";
import Contract from "../../models/contract.js";
import { emitEvent } from "../../utils/emitEvent.js";
import { updateCaretakerProfile } from "../../services/caretaker/caretakerService.js";

/** CARETAKER LOGIN */
export const loginCaretaker = async (req, res) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const result = await caretakerLogin({ userName, password });

    return res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      role: "caretaker",
      caretaker: result.caretaker,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid username or password",
    });
  }
};

/** FETCH CARETAKER PROFILE */
export const fetchCaretakerProfile = async (req, res) => {
  try {
    const { instance } = req.caretaker;

    return res.status(200).json({
      success: true,
      caretaker: {
        id: instance.ID,
        caretaker_id: instance.publicUserID,
        fullName: instance.fullName,
        contactNumber: instance.contactNumber,
        username: instance.userName,
        emailAddress: instance.emailAddress,
        role: instance.role,
      },
    });
  } catch (error) {
    console.error("Fetch caretaker profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch caretaker profile",
    });
  }
};

/** UPDATE CARETAKER PROFILE */
export const saveCaretakerProfile = async (req, res) => {
  try {
    const updatedUser = await updateCaretakerProfile(req.caretaker, req.body);

    // Real-time update
    emitEvent(req, "dataUpdated", {
      type: "CARETAKER",
      action: "UPDATED",
      caretaker_id: updatedUser.publicUserID,
    });

    return res.status(200).json({
      success: true,
      message: "Caretaker profile updated successfully",
      caretaker: {
        id: updatedUser.ID,
        caretaker_id: updatedUser.publicUserID,
        fullName: updatedUser.fullName,
        contactNumber: updatedUser.contactNumber,
        username: updatedUser.userName,
        emailAddress: updatedUser.emailAddress,
        role: updatedUser.role,
      },
    });

  } catch (error) {
   
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/** GET TENANTS OVERVIEW (caretaker-accessible) */
export const getTenantsOverviewCaretaker = async (req, res) => {
  try {
    const tenants = await User.findAll({
      where: { role: "tenant", status: "Approved" },
      include: [{
        model: Contract,
        as: "contracts",
        where: { status: "Active" },
        required: false,
        include: [{ model: Unit, as: "unit" }],
      }],
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({ success: true, count: tenants.length, tenants });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch tenants" });
  }
};

/** GET UNITS (caretaker-accessible) */
export const getUnitsCaretaker = async (req, res) => {
  try {
    const units = await Unit.findAll({
      include: [{
        model: Contract,
        as: "contracts",
        where: { status: "Active" },
        required: false,
        attributes: ["ID", "status"],
      }],
      order: [["unit_number", "ASC"]],
    });

    const result = units.map((u) => ({
      ID:          u.ID,
      unit_number: u.unit_number,
      floor:       u.floor,
      is_active:   u.is_active,
      isOccupied:  (u.contracts ?? []).length > 0,
    }));

    return res.status(200).json({ success: true, units: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch units" });
  }
};
