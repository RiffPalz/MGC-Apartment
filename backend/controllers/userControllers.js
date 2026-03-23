import {
  registerUser,
  loginUser,
  getUserProfileService,
  updateUserProfileService
} from "../services/userService.js";

import { emitEvent } from "../utils/emitEvent.js";

/* REGISTER USER */
export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    emitEvent(req, "dataUpdated", {
      type: "USER",
      action: "CREATED",
      publicUserID: user.publicUserID,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.ID,
        publicUserID: user.publicUserID,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        userName: user.userName,
        unitNumber: user.unitNumber,
        role: user.role,
      },
    });

  } catch (error) {
  
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* LOGIN USER */
export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      loginToken: result.loginToken,
      user: result.user,
    });

  } catch (error) {
  
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

/* GET USER PROFILE */
export const getUserProfile = async (req, res) => {
  try {
    const user = await getUserProfileService(req.auth.id);

    return res.status(200).json({
      success: true,
      user: {
        id: user.ID,
        publicUserID: user.publicUserID,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        userName: user.userName,
        contactNumber: user.contactNumber,
        unitNumber: user.unitNumber,
        numberOfTenants: user.numberOfTenants,
        role: user.role,
      },
    });

  } catch (error) {
  
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/* UPDATE USER PROFILE */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await updateUserProfileService(req.auth.id, req.body);

    emitEvent(req, "profile_updated", {
      userId: user.ID,
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      userName: user.userName,
      contactNumber: user.contactNumber,
      unitNumber: user.unitNumber,
      numberOfTenants: user.numberOfTenants,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.ID,
        publicUserID: user.publicUserID,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        userName: user.userName,
        contactNumber: user.contactNumber,
        unitNumber: user.unitNumber,
        numberOfTenants: user.numberOfTenants,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Update User Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};