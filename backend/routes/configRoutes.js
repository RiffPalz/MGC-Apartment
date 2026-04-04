import express from "express";
import { getConfigController } from "../controllers/admin/adminConfigController.js";

const configRouter = express.Router();

configRouter.get("/", getConfigController);

export { configRouter };
