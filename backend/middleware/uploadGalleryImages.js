import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { isLocalStorage, diskStorage } from "../utils/localStorage.js";

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "MGC-Building/gallery",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const localDiskStorage = diskStorage("gallery", (_req, file) => {
  const base = file.fieldname || "gallery";
  return `${base}_${Date.now()}`;
});

const uploadGalleryImages = multer({
  storage: isLocalStorage() ? localDiskStorage : cloudinaryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "gallery_0", maxCount: 1 },
  { name: "gallery_1", maxCount: 1 },
  { name: "gallery_2", maxCount: 1 },
  { name: "gallery_3", maxCount: 1 },
  { name: "gallery_4", maxCount: 1 },
]);

export default uploadGalleryImages;
