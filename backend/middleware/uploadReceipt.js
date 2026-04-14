import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { isLocalStorage, diskStorage } from "../utils/localStorage.js";

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => {
    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    return {
      folder: `MGC-Building/receipts/tenant_${req.auth.id}`,
      allowed_formats: ["jpg", "jpeg", "png"],
      public_id: `receipt_${date}_${Date.now()}`,
    };
  },
});

const localDiskStorage = diskStorage("receipts", (req) => {
  const tenantId = req.auth?.id || "unknown";
  return `receipt_tenant${tenantId}_${Date.now()}`;
});

const uploadReceipt = multer({
  storage: isLocalStorage() ? localDiskStorage : cloudinaryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default uploadReceipt;
