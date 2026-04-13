import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const date = new Date().toISOString().split("T")[0];
    const contractId = req.body?.contract_id || "unknown";
    const ext = file.originalname.substring(file.originalname.lastIndexOf("."));

    return {
      folder: `MGC-Building/utility-bills/contract_${contractId}`,
      resource_type: "raw",
      type: "upload",
      access_mode: "public",
      allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      public_id: `utility_bill_${date}_${Date.now()}${ext}`,
    };
  },
});

const uploadUtilityBill = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default uploadUtilityBill;
