import User from "../../models/user.js";
import Unit from "../../models/unit.js";
import { Op } from "sequelize";
import { createActivityLog } from "../../services/activityLogService.js";
import { createNotification } from "../../services/notificationService.js";
import { sendMail } from "../../utils/mailer.js";
import { accountApprovedTemplate } from "../../utils/emailTemplate.js";

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

export const createTenant = async (data, adminId) => {
  const { fullName, emailAddress, contactNumber, unitNumber, numberOfTenants, userName, password, sex } = data;

  if (!fullName || !emailAddress || !userName || !password) {
    throw new Error("Missing required fields");
  }

  const existingEmail = await User.findOne({ where: { emailAddress } });
  if (existingEmail) throw new Error("Email already in use");

  const existingUsername = await User.findOne({ where: { userName } });
  if (existingUsername) throw new Error("Username already in use");

  const publicUserID = await generatePublicUserID();

  const tenant = await User.create({
    publicUserID,
    fullName,
    emailAddress,
    contactNumber,
    unitNumber,
    numberOfTenants,
    userName,
    password_hash: password,
    role: "tenant",
    status: "Approved",
    sex: sex || null,
  });

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "CREATE TENANT",
    description: `You created a tenant account for ${tenant.fullName} (Unit ${tenant.unitNumber ?? "—"}).`,
    referenceId: tenant.ID,
    referenceType: "user",
  });

  // Automatically mark the assigned unit as Occupied when tenant is created by admin
  if (tenant.unitNumber) {
    const unit = await Unit.findOne({ where: { unit_number: tenant.unitNumber } });
    if (unit) {
      unit.status = "Occupied";
      unit.is_active = true;
      await unit.save();
    }
  }

  await createNotification({
    userId: tenant.ID,
    role: "tenant",
    type: "ACCOUNT",
    title: "Account Created",
    message: "Your tenant account has been created by admin.",
    referenceId: tenant.ID,
    referenceType: "user",
  });

  sendMail({
    to: tenant.emailAddress,
    subject: "MGC Building — Account Approved",
    html: accountApprovedTemplate(tenant.fullName),
  }).catch(() => {});

  return {
    message: "Tenant created successfully",
    tenantId: tenant.ID,
    publicUserID: tenant.publicUserID,
  };
};
