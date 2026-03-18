import { caretakerLogin } from "../../services/caretaker/caretakerAuthService.js";
import User from "../../models/user.js";
import { emitEvent } from "../../utils/emitEvent.js";
import { updateCaretakerProfile } from "../../services/caretaker/caretakerService.js";

/**
 * ==============================
 * CARETAKER LOGIN
 * ==============================
 */
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

/**
 * ==============================
 * FETCH CARETAKER PROFILE
 * ==============================
 */
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

/**
 * ==============================
 * UPDATE CARETAKER PROFILE
 * ==============================
 */
export const saveCaretakerProfile = async (req, res) => {
  try {
    const updatedUser = await updateCaretakerProfile(req.caretaker, req.body);

    // 🔔 Real-time update
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
