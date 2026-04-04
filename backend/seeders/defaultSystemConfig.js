import SystemConfig from "../models/systemConfig.js";

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
    { url: "<existing-img1-url>", caption: "Front View", slot: "left1" },
    { url: "<existing-img2-url>", caption: "Main Gate", slot: "rightTop" },
    { url: "<existing-img3-url>", caption: "Parking Space", slot: "left2" },
    { url: "<existing-img4-url>", caption: "Inside the Building", slot: "rightLarge" },
    { url: "<existing-img5-url>", caption: "Main Road", slot: "left3" },
  ],
};

export const createDefaultSystemConfig = async () => {
  try {
    const [config, created] = await SystemConfig.findOrCreate({
      where: {},
      defaults: DEFAULT_CONFIG,
    });

    if (created) {
      console.log("Default system config created successfully");
    } else {
      console.log("Default system config already exists");
    }
  } catch (error) {
    console.error("Failed to create default system config:", error);
  }
};
