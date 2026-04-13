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

    const fullName = req.body.fullName || "unknown";
    const safeName = fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    return {
      folder: "MGC-Building/application_requests",
      resource_type: "auto",
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
      public_id: `${safeName}_${date}_${Date.now()}`,
    };
  },
});

const uploadApplicationID = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default uploadApplicationID;
