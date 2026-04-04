import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "MGC-Building/gallery",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadGalleryImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).fields([
  { name: "gallery_0", maxCount: 1 },
  { name: "gallery_1", maxCount: 1 },
  { name: "gallery_2", maxCount: 1 },
  { name: "gallery_3", maxCount: 1 },
  { name: "gallery_4", maxCount: 1 },
]);

export default uploadGalleryImages;
