import {
  adminLogin,
  verifyAdminOtp,
  resendAdminCode
} from "../../services/admin/adminAuthService.js";

import {
  updateAdminProfile,
  updateTenantApprovalService,
  createCaretakerService,
  createAdminService,
  deleteUserService
} from "../../services/admin/adminService.js";

import User from "../../models/user.js";
import { Op } from "sequelize";
import Contract from "../../models/contract.js";
import Unit from "../../models/unit.js";
import { emitEvent } from "../../utils/emitEvent.js";

/* LOGIN */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await adminLogin({ email, password });

    return res.status(200).json({
      success: true,
      message: result.message,
      adminId: result.adminId,
    });

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

/* VERIFY OTP */
export const loginCodeVerify = async (req, res) => {
  try {
    const { adminId, verificationCode } = req.body;
    const result = await verifyAdminOtp({ adminId, verificationCode });

    return res.status(200).json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      admin: result.admin,
    });

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

/* FETCH PROFILE */
export const fetchAdminProfile = async (req, res) => {
  try {
    const { instance: admin } = req.admin;

    return res.status(200).json({
      success: true,
      admin: {
        id: admin.ID,
        adminID: admin.publicUserID,
        fullName: admin.fullName,
        contactNumber: admin.contactNumber,
        emailAddress: admin.emailAddress,
        userName: admin.userName,
        role: admin.role,
        profilePicture: admin.profilePicture || null,
      },
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin profile"
    });
  }
};

/* UPDATE PROFILE */
export const saveAdminProfile = async (req, res) => {
  try {
    const updatedAdmin = await updateAdminProfile(req.admin, req.body);

    emitEvent(req, "dataUpdated", {
      type: "ADMIN",
      action: "UPDATED",
      adminID: updatedAdmin.publicUserID,
    });

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin: {
        id: updatedAdmin.ID,
        adminID: updatedAdmin.publicUserID,
        fullName: updatedAdmin.fullName,
        contactNumber: updatedAdmin.contactNumber,
        emailAddress: updatedAdmin.emailAddress,
        userName: updatedAdmin.userName,
        role: updatedAdmin.role,
        profilePicture: updatedAdmin.profilePicture || null,
      },
    });


  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* UPLOAD PROFILE PICTURE */
export const uploadProfilePictureController = async (req, res) => {
  try {
    const { instance: admin } = req.admin;

    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    admin.profilePicture = req.file.path;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture updated",
      profilePicture: admin.profilePicture,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* RESEND OTP */
export const resendCodeController = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required"
      });
    }

    await resendAdminCode(adminId);

    return res.status(200).json({
      success: true,
      message: "Verification code resent successfully"
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* CREATE CARETAKER */
export const createCaretaker = async (req, res) => {
  try {
    const caretaker = await createCaretakerService(req.admin.instance, req.body);

    return res.status(201).json({
      success: true,
      message: "Caretaker created successfully",
      caretaker
    });


  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* CREATE ADMIN */
export const createAdmin = async (req, res) => {
  try {
    const admin = await createAdminService(req.admin.instance, req.body);

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin
    });


  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* DELETE USER */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await deleteUserService(req.admin.instance, userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });


  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* GET SINGLE TENANT PROFILE */
export const getTenantProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await User.findOne({
      where: { ID: id, role: "tenant" },
      include: [{
        model: Contract,
        as: "contracts",
        where: { status: "Active" },
        required: false,
        include: [{ model: Unit, as: "unit" }],
      }],
    });

    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

    const activeContract = tenant.contracts?.[0] ?? null;

    return res.status(200).json({
      success: true,
      tenant: {
        id: tenant.ID,
        publicUserID: tenant.publicUserID,
        fullName: tenant.fullName,
        emailAddress: tenant.emailAddress,
        contactNumber: tenant.contactNumber,
        unitNumber: tenant.unitNumber,
        numberOfTenants: tenant.numberOfTenants,
        userName: tenant.userName,
        status: tenant.status,
        createdAt: tenant.created_at,
        contract: activeContract ? {
          id: activeContract.ID,
          startDate: activeContract.start_date,
          endDate: activeContract.end_date,
          rentAmount: activeContract.rent_amount,
          status: activeContract.status,
          unit: activeContract.unit ? {
            id: activeContract.unit.ID,
            unitNumber: activeContract.unit.unit_number,
            floor: activeContract.unit.floor,
          } : null,
        } : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch tenant profile" });
  }
};

/* GET APPROVED TENANTS WITHOUT ACTIVE CONTRACT */
export const getApprovedTenantsNoContract = async (req, res) => {
  try {
    const tenants = await User.findAll({
      where: { role: "tenant", status: "Approved" },
      include: [{
        model: Contract,
        as: "contracts",
        where: { status: "Active" },
        required: false,
      }],
      order: [["created_at", "DESC"]],
    });

    // Only those with no active contract
    const result = tenants
      .filter((t) => !t.contracts || t.contracts.length === 0)
      .map((t) => ({
        ID: t.ID,
        fullName: t.fullName,
        emailAddress: t.emailAddress,
        contactNumber: t.contactNumber,
        unitNumber: t.unitNumber,
        userName: t.userName,
        publicUserID: t.publicUserID,
      }));

    return res.status(200).json({ success: true, tenants: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch tenants" });
  }
};

/* GET STAFF (admins + caretakers) */
export const getStaffUsers = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { role: ["admin", "caretaker"] },
      attributes: ["ID", "publicUserID", "fullName", "emailAddress", "userName", "contactNumber", "role", "status", "created_at"],
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({ success: true, staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch staff" });
  }
};

/* GET PENDING TENANTS */
export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: "tenant", status: "Pending" },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });


  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending users"
    });
  }
};

/* APPROVE / DECLINE TENANT */
export const updateUserApproval = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    await updateTenantApprovalService(req.admin.instance, userId, status);

    return res.status(200).json({
      success: true,
      message: `Tenant ${status} successfully`
    });

  } catch (error) {
    console.error("updateUserApproval error:", error.message, "| userId:", req.params.userId, "| status:", req.body?.status);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* TENANTS OVERVIEW */
export const getTenantsOverview = async (req, res) => {
  try {
    const tenants = await User.findAll({
      where: { role: "tenant", status: "Approved" },
      include: [
        {
          model: Contract,
          as: "contracts",
          where: { status: "Active" },
          required: false,
          include: [{ model: Unit, as: "unit" }]
        }
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: tenants.length,
      tenants
    });


  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tenants overview"
    });
  }
};