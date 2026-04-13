import User from "../models/user.js";
import Contract from "../models/contract.js";
import ContractTenant from "../models/contractTenant.js";
import Unit from "../models/unit.js";
import { generateAccessToken, generateLoginToken } from "../utils/token.js";
import { Op } from "sequelize";
import { createActivityLog } from "../services/activityLogService.js";
import { sendSMS, sendSMSBulk } from "../utils/sms.js";
import { sms } from "../utils/smsTemplates.js";

const generatePublicUserID = async () => {
  const lastUser = await User.findOne({
    where: { publicUserID: { [Op.like]: "TENANT-%" } },
    order: [["created_at", "DESC"]],
  });

  let nextNumber = 1;
  if (lastUser?.publicUserID) {
    const match = lastUser.publicUserID.match(/TENANT-(\d+)/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `TENANT-${String(nextNumber).padStart(3, "0")}`;
};

export const registerUser = async (userData) => {
  const { fullName, email, contactNumber, unitNumber, numberOfTenants, userName, password, sex } = userData;

  if (!fullName || !email || !userName || !password || !unitNumber) {
    throw new Error("All required fields must be provided");
  }

  const existingEmail = await User.findOne({ where: { emailAddress: email } });
  if (existingEmail && existingEmail.status !== "Declined") throw new Error("Email already in use");

  const existingUsername = await User.findOne({ where: { userName } });
  if (existingUsername && existingUsername.status !== "Declined") {
    throw new Error("This username already has an existing account.");
  }

  // Remove old Declined records that would conflict on unique constraints
  await User.destroy({
    where: {
      status: "Declined",
      [Op.or]: [{ emailAddress: email }, { userName }],
    },
  });

  const unit = await Unit.findOne({ where: { unit_number: unitNumber } });
  if (!unit) throw new Error("Invalid unit number");

  const activeContract = await Contract.findOne({ where: { unit_id: unit.ID, status: "Active" } });
  if (activeContract) {
    const tenantCount = await ContractTenant.count({ where: { contract_id: activeContract.ID } });
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
    sex: sex || null,
  });

  const { sendMail } = await import("../utils/mailer.js");
  const { accountPendingTemplate } = await import("../utils/emailTemplate.js");
  sendMail({
    to: email,
    subject: "MGC Building — Account Under Review",
    html: accountPendingTemplate(fullName),
  }).catch(() => {});

  sendSMS(contactNumber, sms.registrationReceived(fullName));

  const admins = await User.findAll({
    where: { role: "admin", status: "Approved" },
    attributes: ["contactNumber"],
  });
  sendSMSBulk(
    admins.map((a) => a.contactNumber),
    `New tenant registration from ${fullName} (Unit ${unitNumber}). Please review and approve the account.`
  );

  return user;
};

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

  await createActivityLog({
    userId: user.ID,
    role: user.role,
    action: "LOGIN",
    description: "You logged in to your account.",
    referenceId: user.ID,
    referenceType: "user",
  });

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

export const getUserProfileService = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");
  return user;
};

export const updateUserProfileService = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  const { fullName, emailAddress, contactNumber, numberOfTenants, currentPassword, newPassword } = updateData;

  if (fullName) user.fullName = fullName;
  if (contactNumber !== undefined) user.contactNumber = contactNumber;
  if (numberOfTenants !== undefined) user.numberOfTenants = numberOfTenants;

  if (emailAddress && emailAddress !== user.emailAddress) {
    const emailExists = await User.findOne({ where: { emailAddress } });
    if (emailExists) throw new Error("Email already in use");
    user.emailAddress = emailAddress;
  }

  if (newPassword) {
    if (!currentPassword) throw new Error("Current password is required");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new Error("Current password is incorrect");
    if (newPassword.length < 6) throw new Error("New password must be at least 6 characters");
    user.password_hash = newPassword;
  }

  await user.save();

  await createActivityLog({
    userId: user.ID,
    role: user.role,
    action: "UPDATE PROFILE",
    description: "You updated your personal account information.",
    referenceId: user.ID,
    referenceType: "user",
  });

  return user;
};

export const checkAvailabilityService = async (userName) => {
  const takenUsers = await User.findAll({
    where: { role: "tenant", unitNumber: { [Op.ne]: null } },
    attributes: ["unitNumber", "status"],
  });

  const takenUnits = [
    ...new Set(
      takenUsers
        .filter((u) => u.status !== "Declined")
        .map((u) => u.unitNumber)
    ),
  ];

  let usernameTaken = false;
  if (userName) {
    const existing = await User.findOne({ where: { userName } });
    if (existing && existing.status !== "Declined") usernameTaken = true;
  }

  return { takenUnits, usernameTaken };
};

export const forgotPasswordService = async (emailAddress) => {
  const user = await User.findOne({ where: { emailAddress, role: "tenant" } });
  if (!user) throw new Error("No registered account found with this email address.");

  const { generateVerificationCode } = await import("../utils/codeGenerator.js");
  const { sendMail } = await import("../utils/mailer.js");
  const { passwordResetTemplate } = await import("../utils/emailTemplate.js");

  const resetCode = generateVerificationCode();
  user.resetPasswordCode = resetCode;
  user.code_expires_at = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendMail({
    to: user.emailAddress,
    subject: "MGC Building — Password Reset Code",
    html: passwordResetTemplate(user.fullName, resetCode),
  });

  return { message: "Password reset code sent to your email." };
};

export const resetPasswordService = async (emailAddress, resetCode, newPassword) => {
  const user = await User.findOne({ where: { emailAddress, role: "tenant" } });
  if (!user) throw new Error("Account not found.");

  if (!user.resetPasswordCode || user.resetPasswordCode !== resetCode) {
    throw new Error("Invalid reset code.");
  }

  if (!user.code_expires_at || user.code_expires_at < new Date()) {
    throw new Error("Reset code has expired. Please request a new one.");
  }

  user.password_hash = newPassword;
  user.resetPasswordCode = null;
  user.code_expires_at = null;
  await user.save();

  return { message: "Password reset successfully." };
};
