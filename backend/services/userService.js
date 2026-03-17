import User from "../models/user.js";
import Contract from "../models/contract.js";
import ContractTenant from "../models/contractTenant.js";
import Unit from "../models/unit.js";
import { generateAccessToken, generateLoginToken } from "../utils/token.js";
import { Op } from "sequelize";
import { createActivityLog } from "../services/activityLogService.js";

// Creates a unique ID like TENANT-001, TENANT-002, etc.
const generatePublicUserID = async () => {
  const lastUser = await User.findOne({
    where: { publicUserID: { [Op.like]: "TENANT-%" } },
    order: [["created_at", "DESC"]],
  });

  let nextNumber = 1;

  if (lastUser && lastUser.publicUserID) {
    const match = lastUser.publicUserID.match(/TENANT-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `TENANT-${String(nextNumber).padStart(3, "0")}`;
};

// Handle new tenant registration
export const registerUser = async (userData) => {
  const { fullName, email, contactNumber, unitNumber, numberOfTenants, userName, password } = userData;

  if (!fullName || !email || !userName || !password || !unitNumber) {
    throw new Error("All required fields must be provided");
  }

  if (await User.findOne({ where: { emailAddress: email } })) {
    throw new Error("Email already in use");
  }
  if (await User.findOne({ where: { userName } })) {
    throw new Error("Username already in use");
  }

  const unit = await Unit.findOne({ where: { unit_number: unitNumber } });
  if (!unit) throw new Error("Invalid unit number");

  const activeContract = await Contract.findOne({
    where: { unit_id: unit.ID, status: "Active" },
  });

  if (activeContract) {
    const tenantCount = await ContractTenant.count({
      where: { contract_id: activeContract.ID },
    });
    if (tenantCount >= 2) throw new Error("This unit number is already fully occupied");
  }

  const publicUserID = await generatePublicUserID();
  const user = await User.create({
    publicUserID,
    fullName,
    emailAddress: email,
    contactNumber,
    unitNumber,
    numberOfTenants,
    userName,
    password_hash: password,
    role: "tenant",
  });

  return user;
};

// Handle tenant login and token generation
export const loginUser = async ({ userName, password }) => {
  const user = await User.findOne({ where: { userName } });

  if (!user || user.role !== "tenant") throw new Error("Invalid username or password");
  if (user.status !== "Approved") throw new Error("Your account is still pending admin approval");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Invalid username or password");

  const accessToken = generateAccessToken({ id: user.ID, role: user.role });
  const loginToken = generateLoginToken();

  user.loginToken = loginToken;
  await user.save();

  return {
    message: "Login successful",
    accessToken,
    loginToken,
    user: {
      id: user.ID,
      publicUserID: user.publicUserID,
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      userName: user.userName,
      contactNumber: user.contactNumber,
      unitNumber: user.unitNumber,
      role: user.role,
    },
  };
};

// Handle fetching user profile
export const getUserProfileService = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");
  return user;
};

// Handle updating user profile and logging activity
export const updateUserProfileService = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  // Secure extraction: only pull editable fields
  const { fullName, emailAddress, contactNumber } = updateData;

  if (fullName) user.fullName = fullName;
  if (contactNumber) user.contactNumber = contactNumber;

  if (emailAddress && emailAddress !== user.emailAddress) {
    const emailExists = await User.findOne({ where: { emailAddress } });
    if (emailExists) throw new Error("Email already in use");
    user.emailAddress = emailAddress;
  }

  await user.save();

  // Log Activity
  await createActivityLog({
    userId: user.ID,
    role: user.role, // "tenant"
    action: "UPDATE_PROFILE",
    description: "Tenant updated their personal account information.",
    referenceId: user.ID,
    referenceType: "user"
  });

  return user;
};