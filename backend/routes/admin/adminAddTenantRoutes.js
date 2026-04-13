import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import { createTenantController } from "../../controllers/admin/adminTenantController.js";

const router = express.Router();

router.post("/", adminAuth, createTenantController);

export default router;
