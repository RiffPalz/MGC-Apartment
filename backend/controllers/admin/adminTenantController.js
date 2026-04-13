import { createTenant } from "../../services/admin/adminAddTenantService.js";

export const createTenantController = async (req, res) => {
  try {
    const result = await createTenant(req.body, req.admin.id);
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
