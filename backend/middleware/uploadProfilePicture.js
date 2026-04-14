import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { isLocalStorage, diskStorage } from "../utils/localStorage.js";

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => ({
    folder: "MGC-Building/profile-pictures",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    public_id: `admin_${req.admin.id}_${Date.now()}`,
  }),
});

const localDiskStorage = diskStorage("profile_pictures", (req) => {
  const id = req.admin?.id || req.caretaker?.id || "user";
  return `profile_${id}_${Date.now()}`;
});

const uploadProfilePicture = multer({
  storage: isLocalStorage() ? localDiskStorage : cloudinaryStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
});

export default uploadProfilePicture;
