import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getUserContractsController,
} from "../controllers/userContractController.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("tenant"),
  getUserContractsController
);

export default router;