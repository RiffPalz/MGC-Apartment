import Contract from "../models/contract.js";
import Unit from "../models/unit.js";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

// Generate a working Cloudinary URL regardless of how the file was originally uploaded.
// Old files were stored with /image/upload/ path but are actually raw (PDF).
// We extract the public_id and regenerate the URL with resource_type: raw.
const getWorkingPdfUrl = (storedUrl) => {
  if (!storedUrl) return null;

  try {
    // Extract public_id from the stored URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public_id>
    const match = storedUrl.match(/\/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return storedUrl;

    const publicId = match[1]; // e.g. MGC-Building/contracts/unit_2/contract_2026-01-01_123.pdf

    // Generate a fresh URL with resource_type: raw
    return cloudinary.url(publicId, {
      resource_type: "raw",
      secure: true,
    });
  } catch {
    return storedUrl;
  }
};export const getUserContracts = async (userId) => {
  const contracts = await Contract.findAll({
    include: [
      {
        model: User,
        as: "tenants",
        required: true,
        where: { ID: userId },
        attributes: []
      },
      {
        model: Unit,
        as: "unit",
        attributes: ["unit_number", "floor"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return contracts.map((c) => {
    const json = c.toJSON();
    json.contract_file = getWorkingPdfUrl(json.contract_file);
    return json;
  });
};