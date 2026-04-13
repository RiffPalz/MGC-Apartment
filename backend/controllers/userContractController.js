import axios from "axios";
import { getUserContracts } from "../services/userContractService.js";
import Contract from "../models/contract.js";
import cloudinary from "../config/cloudinary.js";

export const getUserContractsController = async (req, res) => {
  try {
    const contracts = await getUserContracts(req.auth.id);
    return res.status(200).json({ success: true, count: contracts.length, contracts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch contracts" });
  }
};

/* Signs the Cloudinary URL and redirects, or streams bytes as fallback */
export const proxyContractPdf = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract?.contract_file) {
      return res.status(404).json({ success: false, message: "Contract file not found." });
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
  } catch (error) {
    console.error("PDF proxy error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load PDF." });
  }
};
