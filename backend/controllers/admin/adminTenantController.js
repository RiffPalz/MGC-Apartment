import { createTenant } from "../../services/admin/adminAddTenantService.js";

/* CREATE TENANT */
export const createTenantController = async (req, res) => {
  try {
    const adminId = req.admin.id;

    const result = await createTenant(req.body, adminId);

    return res.status(201).json({
      success: true,
      message: result.message,
      tenantId: result.tenantId,
      publicUserID: result.publicUserID,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};