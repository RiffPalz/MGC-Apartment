import { caretakerLogin } from "../../services/caretaker/caretakerAuthService.js";
import { User, Contract, Unit } from "../../models/index.js";
import { emitEvent } from "../../utils/emitEvent.js";
import { updateCaretakerProfile } from "../../services/caretaker/caretakerService.js";

export const loginCaretaker = async (req, res) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const result = await caretakerLogin({ userName, password });
    return res.status(200).json({ success: true, accessToken: result.accessToken, role: "caretaker", caretaker: result.caretaker });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || "Invalid username or password" });
  }
};

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
    return res.status(500).json({ success: false, message: "Failed to fetch caretaker profile" });
  }
};

export const saveCaretakerProfile = async (req, res) => {
  try {
    const updatedUser = await updateCaretakerProfile(req.caretaker, req.body);

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
    return res.status(400).json({ success: false, message: error.message });
  }
};

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
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch tenants" });
  }
};

export const getUnitsCaretaker = async (req, res) => {
  try {
    const units = await Unit.findAll({
      include: [{
        model: Contract,
        as: "contracts",
        where: { status: "Active" },
        required: false,
        include: [{
          model: User,
          as: "tenants",
          attributes: ["ID"],
          through: { attributes: [] },
          required: true,
        }],
        attributes: ["ID", "status"],
      }],
      order: [["unit_number", "ASC"]],
    });

    const result = units.map((u) => {
      const hasActiveTenants = (u.contracts ?? []).some((c) => (c.tenants ?? []).length > 0);
      let status;
      if (!u.is_active) status = "Disabled";
      else if (hasActiveTenants) status = "Occupied";
      else if (u.status === "Under Maintenance") status = "Under Maintenance";
      else status = "Vacant";

      return {
        ID: u.ID,
        unit_number: u.unit_number,
        floor: u.floor,
        is_active: u.is_active,
        status,
        isOccupied: status === "Occupied",
      };
    });

    return res.status(200).json({ success: true, units: result });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch units" });
  }
};

export const createTenantCaretaker = async (req, res) => {
  try {
    const { createTenant } = await import("../../services/admin/adminAddTenantService.js");
    const result = await createTenant(req.body, req.caretaker.id);
    return res.status(201).json({
      success: true,
      message: result.message,
      tenantId: result.tenantId,
      publicUserID: result.publicUserID,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
