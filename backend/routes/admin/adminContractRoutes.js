import express from "express";
import uploadContract from "../../middleware/uploadContract.js";
import adminAuth from "../../middleware/adminAuth.js";

import {
   createContractAdmin,
   terminateContractAdmin,
   renewContractAdmin,
   editContractAdmin,
   getAdminDashboard,
   getExpiringContractsAdmin,
   completeContractAdmin
} from "../../controllers/admin/adminContractController.js";

const router = express.Router();

// Create a new contract with file upload
router.post(
   "/:unit_id",
   adminAuth,
   uploadContract.single("contractFile"),
   createContractAdmin
);

// Edit contract details or update files
router.put(
   "/:id",
   adminAuth,
   uploadContract.single("contractFile"),
   editContractAdmin
);

// Terminate/cancel an active contract
router.put(
   "/:id/terminate",
   adminAuth,
   terminateContractAdmin
);

// Renew an existing contract with a new file
router.post(
   "/:id/renew",
   adminAuth,
   uploadContract.single("contractFile"),
   renewContractAdmin
);

// Get contract statistics for the dashboard
router.get("/dashboard", adminAuth, getAdminDashboard);

// Get a list of contracts nearing expiration
router.get(
   "/expiring",
   adminAuth,
   getExpiringContractsAdmin
);

// Mark a contract as fully completed
router.put(
   "/:id/complete",
   adminAuth,
   completeContractAdmin
);

export default router;