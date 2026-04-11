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
   completeContractAdmin,
   generateContractPdfAdmin,
   deleteContractAdmin,
} from "../../controllers/admin/adminContractController.js";
import {
   getAllTerminationRequestsController,
   approveTerminationRequestController,
   rejectTerminationRequestController,
} from "../../controllers/terminationRequestController.js";
import axios from "axios";
import Contract from "../../models/contract.js";
import cloudinary from "../../config/cloudinary.js";

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

// Renew an existing contract with updated dates and regenerated PDF
router.post(
   "/:id/renew",
   adminAuth,
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

// Generate a PDF contract dynamically
router.post("/:id/generate-pdf", adminAuth, generateContractPdfAdmin);

// Delete a contract permanently
router.delete("/:id", adminAuth, deleteContractAdmin);

// Termination requests (admin)
router.get("/termination-requests", adminAuth, getAllTerminationRequestsController);
router.put("/termination-requests/:id/approve", adminAuth, approveTerminationRequestController);
router.put("/termination-requests/:id/reject", adminAuth, rejectTerminationRequestController);

// Proxy: streams PDF from Cloudinary — avoids CORS/preview issues in browser
router.get("/:id/pdf", adminAuth, async (req, res) => {
   try {
      const contract = await Contract.findByPk(req.params.id);
      if (!contract?.contract_file) return res.status(404).json({ success: false, message: "No PDF found." });

      const pdfUrl = contract.contract_file;

      // Extract public_id from the stored URL for signing
      const match = pdfUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
         // Generate a short-lived signed URL and redirect — Cloudinary handles delivery
         const signedUrl = cloudinary.url(match[1], {
            resource_type: "raw",
            type: "upload",
            secure: true,
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 300, // 5 min
         });
         return res.redirect(signedUrl);
      }

      // Fallback: proxy the bytes directly
      const response = await axios.get(pdfUrl, {
         responseType: "arraybuffer",
         timeout: 15000,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="contract_${req.params.id}.pdf"`);
      return res.send(Buffer.from(response.data));
   } catch (err) {
      console.error("[PDF Proxy Error]", err.message);
      return res.status(500).json({ success: false, message: "Failed to load PDF.", detail: err.message });
   }
});

export default router;