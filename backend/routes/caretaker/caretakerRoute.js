import express from "express";
import {
  loginCaretaker,
  fetchCaretakerProfile,
  saveCaretakerProfile,
  getTenantsOverviewCaretaker,
  getUnitsCaretaker,
  createTenantCaretaker,
} from "../../controllers/caretaker/caretakerController.js";
import caretakerAuth from "../../middleware/caretakerAuth.js";

const caretakerRouter = express.Router();

caretakerRouter.post("/login", loginCaretaker);
caretakerRouter.get("/profile", caretakerAuth, fetchCaretakerProfile);
caretakerRouter.patch("/profile/update", caretakerAuth, saveCaretakerProfile);
caretakerRouter.get("/tenants", caretakerAuth, getTenantsOverviewCaretaker);
caretakerRouter.get("/units", caretakerAuth, getUnitsCaretaker);
caretakerRouter.post("/tenants", caretakerAuth, createTenantCaretaker);

export default caretakerRouter;
