import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => ({
    folder: "MGC-Building/profile-pictures",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    public_id: `admin_${req.admin.id}_${Date.now()}`,
  }),
});

const uploadProfilePicture = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
});

export default uploadProfilePicture;
