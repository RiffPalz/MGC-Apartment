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
import TerminationRequest from "../../models/terminationRequest.js";
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

// PDF proxy — streams bytes directly to avoid cross-origin redirect issues
router.get("/:id/pdf", adminAuth, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract?.contract_file) {
      return res.status(404).json({ success: false, message: "No PDF found." });
    }

    const pdfUrl = contract.contract_file;

    // Build the fetch URL — sign it if it's a Cloudinary raw asset
    let fetchUrl = pdfUrl;
    const match = pdfUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    if (match) {
      fetchUrl = cloudinary.url(match[1], {
        resource_type: "raw",
        type: "upload",
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 300,
      });
    }

    const response = await axios.get(fetchUrl, { responseType: "arraybuffer", timeout: 15000 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="contract_${req.params.id}.pdf"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("[PDF Proxy Error]", err.message);
    return res.status(500).json({ success: false, message: "Failed to load PDF.", detail: err.message });
  }
});

// Termination request PDF proxy — streams bytes directly
router.get("/termination-requests/:id/pdf", adminAuth, async (req, res) => {
  try {
    const request = await TerminationRequest.findByPk(req.params.id);
    if (!request?.request_pdf) {
      return res.status(404).json({ success: false, message: "No PDF found." });
    }

    const pdfUrl = request.request_pdf;
    let fetchUrl = pdfUrl;
    const match = pdfUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    if (match) {
      fetchUrl = cloudinary.url(match[1], {
        resource_type: "raw",
        type: "upload",
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 300,
      });
    }

    const response = await axios.get(fetchUrl, { responseType: "arraybuffer", timeout: 15000 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="termination_request_${req.params.id}.pdf"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("[Termination PDF Proxy Error]", err.message);
    return res.status(500).json({ success: false, message: "Failed to load PDF." });
  }
});

export default router;
