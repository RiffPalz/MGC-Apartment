import express from "express";
import axios from "axios";
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
import Contract from "../../models/contract.js";
import cloudinary from "../../config/cloudinary.js";

const router = express.Router();

router.post("/:unit_id", adminAuth, uploadContract.single("contractFile"), createContractAdmin);
router.put("/:id", adminAuth, uploadContract.single("contractFile"), editContractAdmin);
router.put("/:id/terminate", adminAuth, terminateContractAdmin);
router.post("/:id/renew", adminAuth, renewContractAdmin);
router.get("/dashboard", adminAuth, getAdminDashboard);
router.get("/expiring", adminAuth, getExpiringContractsAdmin);
router.put("/:id/complete", adminAuth, completeContractAdmin);
router.post("/:id/generate-pdf", adminAuth, generateContractPdfAdmin);
router.delete("/:id", adminAuth, deleteContractAdmin);

// Termination requests
router.get("/termination-requests", adminAuth, getAllTerminationRequestsController);
router.put("/termination-requests/:id/approve", adminAuth, approveTerminationRequestController);
router.put("/termination-requests/:id/reject", adminAuth, rejectTerminationRequestController);

// PDF proxy — signs the Cloudinary URL and redirects, or streams bytes as fallback
router.get("/:id/pdf", adminAuth, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract?.contract_file) {
      return res.status(404).json({ success: false, message: "No PDF found." });
    }

    const pdfUrl = contract.contract_file;
    const match = pdfUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);

    if (match) {
      const signedUrl = cloudinary.url(match[1], {
        resource_type: "raw",
        type: "upload",
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 300,
      });
      return res.redirect(signedUrl);
    }

    const response = await axios.get(pdfUrl, { responseType: "arraybuffer", timeout: 15000 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contract_${req.params.id}.pdf"`);
    return res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("[PDF Proxy Error]", err.message);
    return res.status(500).json({ success: false, message: "Failed to load PDF.", detail: err.message });
  }
});

export default router;
