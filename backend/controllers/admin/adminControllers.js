import {
  adminLogin,
  verifyAdminOtp,
  resendAdminCode,
} from "../../services/admin/adminAuthService.js";
import {
  updateAdminProfile,
  updateTenantApprovalService,
  createCaretakerService,
  createAdminService,
  deleteUserService,
} from "../../services/admin/adminService.js";
import User from "../../models/user.js";
import { Op } from "sequelize";
import Contract from "../../models/contract.js";
import Unit from "../../models/unit.js";
import { emitEvent } from "../../utils/emitEvent.js";

export const loginAdmin = async (req, res) => {
  try {
    const result = await adminLogin(req.body);
    return res.status(200).json({ success: true, message: result.message, adminId: result.adminId });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export const loginCodeVerify = async (req, res) => {
  try {
    const result = await verifyAdminOtp(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      admin: result.admin,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

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
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch admin profile" });
  }
};

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
    return res.status(400).json({ success: false, message: error.message });
  }
};

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

export const resendCodeController = async (req, res) => {
  try {
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ success: false, message: "Admin ID is required" });

    await resendAdminCode(adminId);
    return res.status(200).json({ success: true, message: "Verification code resent successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createCaretaker = async (req, res) => {
  try {
    const caretaker = await createCaretakerService(req.admin.instance, req.body);
    return res.status(201).json({ success: true, message: "Caretaker created successfully", caretaker });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const admin = await createAdminService(req.admin.instance, req.body);
    return res.status(201).json({ success: true, message: "Admin created successfully", admin });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await deleteUserService(req.admin.instance, req.params.userId);
    emitEvent(req, "tenants_updated");
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getTenantProfile = async (req, res) => {
  try {
    const tenant = await User.findOne({
      where: { ID: req.params.id, role: "tenant" },
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
        sex: tenant.sex ?? null,
        status: tenant.status,
        createdAt: tenant.created_at,
        contract: activeContract
          ? {
              id: activeContract.ID,
              startDate: activeContract.start_date,
              endDate: activeContract.end_date,
              rentAmount: activeContract.rent_amount,
              status: activeContract.status,
              unit: activeContract.unit
                ? {
                    id: activeContract.unit.ID,
                    unitNumber: activeContract.unit.unit_number,
                    floor: activeContract.unit.floor,
                  }
                : null,
            }
          : null,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch tenant profile" });
  }
};

export const updateTenantProfile = async (req, res) => {
  try {
    const { fullName, emailAddress, contactNumber, numberOfTenants, sex } = req.body;

    const tenant = await User.findOne({ where: { ID: req.params.id, role: "tenant" } });
    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

    if (fullName) tenant.fullName = fullName.trim();
    if (contactNumber !== undefined) tenant.contactNumber = contactNumber;
    if (numberOfTenants !== undefined) tenant.numberOfTenants = numberOfTenants;
    if (sex !== undefined) tenant.sex = sex || null;

    if (emailAddress && emailAddress !== tenant.emailAddress) {
      const exists = await User.findOne({ where: { emailAddress } });
      if (exists) return res.status(400).json({ success: false, message: "Email already in use" });
      tenant.emailAddress = emailAddress.trim();
    }

    const prevPax = tenant.numberOfTenants;
    const newPax = numberOfTenants !== undefined ? Number(numberOfTenants) : prevPax;

    await tenant.save();

    if (numberOfTenants !== undefined && newPax !== prevPax) {
      const newRent = newPax >= 2 ? 3000 : 2500;
      const { default: Contract } = await import("../../models/contract.js");
      const { default: ContractTenant } = await import("../../models/contractTenant.js");
      const link = await ContractTenant.findOne({ where: { user_id: tenant.ID } });
      if (link) {
        const activeContract = await Contract.findOne({ where: { ID: link.contract_id, status: "Active" } });
        if (activeContract) await activeContract.update({ rent_amount: newRent });
      }
    }

    const { createActivityLog } = await import("../../services/activityLogService.js");
    await createActivityLog({
      userId: req.admin.id,
      role: "admin",
      action: "UPDATE TENANT PROFILE",
      description: `You updated the profile of tenant ${tenant.fullName} (${tenant.publicUserID}).`,
      referenceId: tenant.ID,
      referenceType: "user",
    });

    emitEvent(req, "tenants_updated");

    return res.status(200).json({
      success: true,
      message: "Tenant profile updated successfully",
      tenant: {
        id: tenant.ID,
        publicUserID: tenant.publicUserID,
        fullName: tenant.fullName,
        emailAddress: tenant.emailAddress,
        contactNumber: tenant.contactNumber,
        numberOfTenants: tenant.numberOfTenants,
        sex: tenant.sex,
        unitNumber: tenant.unitNumber,
        userName: tenant.userName,
        status: tenant.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch tenants" });
  }
};

export const getStaffUsers = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { role: ["admin", "caretaker"] },
      attributes: ["ID", "publicUserID", "fullName", "emailAddress", "userName", "contactNumber", "role", "status", "created_at"],
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({ success: true, staff });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch staff" });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: "tenant", status: "Pending" },
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({ success: true, count: users.length, users });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch pending users" });
  }
};

export const updateUserApproval = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    await updateTenantApprovalService(req.admin.instance, userId, status);
    emitEvent(req, "tenants_updated");
    emitEvent(req, "units_updated");
    return res.status(200).json({ success: true, message: `Tenant ${status} successfully` });
  } catch (error) {
    console.error("updateUserApproval error:", error.message, "| userId:", req.params.userId, "| status:", req.body?.status);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getTenantsOverview = async (req, res) => {
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
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch tenants overview" });
  }
};
