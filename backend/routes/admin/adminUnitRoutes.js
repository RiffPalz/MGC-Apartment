import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import { fetchAllUnits, updateUnitController } from "../../controllers/admin/adminUnitController.js";

const router = express.Router();

router.get("/",       adminAuth, fetchAllUnits);
router.patch("/:id",  adminAuth, updateUnitController);

export default router;
