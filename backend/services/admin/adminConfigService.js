import SystemConfig from "../../models/systemConfig.js";
import { createActivityLog } from "../../services/activityLogService.js";

const DEFAULT_CONFIG = {
  mgc_name: "MGC Building",
  address: "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
  monthly_rate: 3000,
  monthly_rate_description:
    "Our units are priced competitively to ensure affordability for working professionals.",
  deposit_terms:
    "One-month advance payment, One-month security deposit, Minimum 6-month contract, Subleasing is strictly prohibited",
  deposit_terms_description: "",
  gallery_images: [
    { url: "", caption: "Front View", slot: "left1" },
    { url: "", caption: "Main Gate", slot: "rightTop" },
    { url: "", caption: "Parking Space", slot: "left2" },
    { url: "", caption: "Inside the Building", slot: "rightLarge" },
    { url: "", caption: "Main Road", slot: "left3" },
  ],
};

const VALID_SLOTS = new Set(["left1", "left2", "left3", "rightTop", "rightLarge"]);

export { DEFAULT_CONFIG };

/* GET CONFIG */
export const getConfig = async () => {
  const instance = await SystemConfig.findOne();
  return instance ?? { ...DEFAULT_CONFIG };
};

/* UPDATE CONFIG */
export const updateConfig = async (data, files = {}, adminId = null) => {
  // Load existing record (or create from defaults)
  let instance = await SystemConfig.findOne();
  if (!instance) {
    instance = await SystemConfig.create({ ...DEFAULT_CONFIG });
  }

  // Partial update: only overwrite a field if a non-empty value was provided
  const has = (key) => data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== "";

  if (has("mgc_name"))    instance.mgc_name    = String(data.mgc_name).trim();
  if (has("address"))     instance.address     = String(data.address).trim();
  if (has("monthly_rate")) instance.monthly_rate = data.monthly_rate;
  if (data.monthly_rate_description !== undefined) instance.monthly_rate_description = data.monthly_rate_description;
  if (has("deposit_terms")) instance.deposit_terms = String(data.deposit_terms).trim();
  if (data.deposit_terms_description !== undefined) instance.deposit_terms_description = data.deposit_terms_description;

  // Gallery images — only update if provided
  if (data.gallery_images !== undefined) {
    let galleryImages;
    try {
      galleryImages = typeof data.gallery_images === "string"
        ? JSON.parse(data.gallery_images)
        : data.gallery_images;
    } catch {
      throw { status: 422, message: "gallery_images must be a valid JSON array" };
    }

    if (!Array.isArray(galleryImages)) {
      throw { status: 422, message: "gallery_images must be an array" };
    }

    // Validate slot values only
    for (let i = 0; i < galleryImages.length; i++) {
      if (!VALID_SLOTS.has(galleryImages[i].slot)) {
        throw { status: 422, message: `gallery_images[${i}].slot must be one of: left1, left2, left3, rightTop, rightLarge` };
      }
    }

    // Apply any newly uploaded file URLs
    for (let i = 0; i <= 4; i++) {
      const fileField = `gallery_${i}`;
      if (files[fileField] && files[fileField][0]) {
        if (galleryImages[i]) galleryImages[i] = { ...galleryImages[i], url: files[fileField][0].path };
      }
    }

    instance.gallery_images = galleryImages;
  }

  await instance.save();

  if (adminId) {
    await createActivityLog({
      userId: adminId,
      role: "admin",
      action: "UPDATE SYSTEM CONFIG",
      description: "You updated the system configuration settings.",
      referenceId: instance.id,
      referenceType: "system_config",
    });
  }

  return instance;
};
