import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const isLocalStorage = () => process.env.STORAGE_MODE === "local";

/* Resolve an absolute path inside backend/uploads/<subfolder> */
export const uploadsDir = (subfolder) => {
  const dir = path.resolve(__dirname, "../uploads", subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/* Build the public URL for a locally stored file */
export const localFileUrl = (subfolder, filename) => {
  const base = process.env.BACKEND_URL || "http://localhost:5000";
  return `${base}/uploads/${subfolder}/${filename}`;
};

/* Create a multer disk storage instance for a given subfolder.
   `filenameFn(req, file)` should return the desired filename (without extension). */
export const diskStorage = (subfolder, filenameFn) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir(subfolder)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = filenameFn(req, file);
      cb(null, `${base}${ext}`);
    },
  });

/**
 * Normalize req.file into a usable URL/path string.
 * - Cloudinary: returns req.file.secure_url or req.file.path (already a URL)
 * - Local disk: req.file.path is an absolute filesystem path — convert to HTTP URL
 */
export const getFileUrl = (file, subfolder) => {
  if (!file) return null;
  // Cloudinary sets secure_url; multer-storage-cloudinary also sets path = secure_url
  if (file.secure_url) return file.secure_url;
  // Local disk: path is absolute, extract just the filename
  if (isLocalStorage()) {
    const filename = path.basename(file.path);
    return localFileUrl(subfolder, filename);
  }
  // Fallback (Cloudinary path is already a URL)
  return file.path;
};
