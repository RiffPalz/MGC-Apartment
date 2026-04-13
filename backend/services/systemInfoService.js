import SystemInfo from "../models/systemInfo.js";

const DEFAULTS = {
  systemName: "MGC Building Management System",
  version: "1.0.0",
  contactEmail: "mgcbuilding762@gmail.com",
  address: "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
};

export const getSystemInfo = async () => {
  let info = await SystemInfo.findByPk(1);
  if (!info) info = await SystemInfo.create({ id: 1, ...DEFAULTS });
  return info;
};

export const updateSystemInfo = async (data) => {
  const { systemName, version, contactEmail, address } = data;

  if (!systemName?.trim() || !contactEmail?.trim() || !address?.trim()) {
    throw new Error("systemName, contactEmail, and address are required.");
  }

  let info = await SystemInfo.findByPk(1);
  if (!info) info = await SystemInfo.create({ id: 1, ...DEFAULTS });

  if (systemName !== undefined) info.systemName = systemName.trim();
  if (version !== undefined) info.version = version.trim();
  if (contactEmail !== undefined) info.contactEmail = contactEmail.trim();
  if (address !== undefined) info.address = address.trim();

  await info.save();
  return info;
};
