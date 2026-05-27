import axios from "axios";
import { getUserContracts } from "../services/userContractService.js";
import Contract from "../models/contract.js";
import TerminationRequest from "../models/terminationRequest.js";
import cloudinary from "../config/cloudinary.js";

/* Shared helper — signs a Cloudinary raw URL and streams the bytes */
const streamPdf = async (res, pdfUrl, filename) => {
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
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, max-age=300");
  return res.send(Buffer.from(response.data));
};

export const getUserContractsController = async (req, res) => {
  try {
    const contracts = await getUserContracts(req.auth.id);
    return res.status(200).json({ success: true, count: contracts.length, contracts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch contracts" });
  }
};

/* Streams the contract PDF bytes directly — avoids cross-origin redirect issues */
export const proxyContractPdf = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract?.contract_file) {
      return res.status(404).json({ success: false, message: "Contract file not found." });
    }
    return await streamPdf(res, contract.contract_file, `contract_${req.params.id}.pdf`);
  } catch (error) {
    console.error("PDF proxy error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load PDF." });
  }
};

/* Streams the tenant's termination request PDF bytes directly */
export const proxyTerminationRequestPdf = async (req, res) => {
  try {
    const request = await TerminationRequest.findByPk(req.params.id);
    if (!request?.request_pdf) {
      return res.status(404).json({ success: false, message: "Termination request PDF not found." });
    }
    // Security: ensure the requesting tenant owns this request
    if (String(request.user_id) !== String(req.auth.id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    return await streamPdf(res, request.request_pdf, `termination_request_${req.params.id}.pdf`);
  } catch (error) {
    console.error("Termination PDF proxy error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load PDF." });
  }
};
