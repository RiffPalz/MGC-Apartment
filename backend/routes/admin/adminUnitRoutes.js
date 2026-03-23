import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import {
  fetchAllUnits,
  createUnitController,
  updateUnitController,
  deleteUnitController,
} from "../../controllers/admin/adminUnitController.js";

const router = express.Router();

router.get("/",       adminAuth, fetchAllUnits);
router.post("/",      adminAuth, createUnitController);
router.patch("/:id",  adminAuth, updateUnitController);
router.delete("/:id", adminAuth, deleteUnitController);

export default router;
