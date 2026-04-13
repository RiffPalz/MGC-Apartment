import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => {
    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const unitId = req.params.unit_id || req.params.id || "unknown";

    return {
      folder: `MGC-Building/contracts/unit_${unitId}`,
      resource_type: "raw",
      allowed_formats: ["pdf"],
      public_id: `contract_${date}_${Date.now()}`,
      type: "upload",
    };
  },
});

const uploadContract = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default uploadContract;
