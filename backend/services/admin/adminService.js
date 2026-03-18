import User from "../../models/user.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { createNotification } from "../../services/notificationService.js";

/* =========================
   UPDATE ADMIN PROFILE
========================= */
export const updateAdminProfile = async (adminContext, data) => {
    const { instance: admin } = adminContext;
    const { fullName, contactNumber, emailAddress, userName } = data;

    let changes = [];

    if (fullName && fullName !== admin.fullName) {
        admin.fullName = fullName.trim();
        changes.push("full name");
    }

    if (contactNumber && contactNumber !== admin.contactNumber) {
        admin.contactNumber = contactNumber.trim();
        changes.push("contact number");
    }

    if (emailAddress && emailAddress !== admin.emailAddress) {
        const emailExists = await User.findOne({ where: { emailAddress } });
        if (emailExists) throw new Error("Email already in use");

        admin.emailAddress = emailAddress.trim();
        changes.push("email");
    }

    if (userName && userName !== admin.userName) {
        const userNameExists = await User.findOne({ where: { userName } });
        if (userNameExists) throw new Error("Username already in use");

        admin.userName = userName.trim();
        changes.push("username");
    }

    await admin.save();

    if (changes.length > 0) {
        await createActivityLog({
            userId: admin.ID,
            role: "admin",
            action: "UPDATE_PROFILE",
            description: `Admin updated: ${changes.join(", ")}`,
            referenceId: admin.ID,
            referenceType: "user"
        });

        await createNotification({
            userId: admin.ID,
            role: "admin",
            type: "ACCOUNT",
            title: "Profile Updated",
            message: "Your admin profile has been updated.",
            referenceId: admin.ID,
            referenceType: "user"
        });
    }

    return admin;
};


/* =========================
   APPROVE / DECLINE TENANT
========================= */
export const updateTenantApprovalService = async (adminUser, userId, status) => {
    const tenant = await User.findByPk(userId);

    if (!tenant || tenant.role !== "tenant") {
        throw new Error("Tenant not found");
    }

    if (!["Approved", "Declined"].includes(status)) {
        throw new Error("Invalid status");
    }

    tenant.status = status;
    await tenant.save();

    await createActivityLog({
        userId: adminUser.ID,
        role: "admin",
        action: "UPDATE_TENANT_STATUS",
        description: `Admin ${status.toLowerCase()} tenant: ${tenant.fullName}`,
        referenceId: tenant.ID,
        referenceType: "user"
    });

    await createNotification({
        userId: tenant.ID,
        role: "tenant",
        type: "ACCOUNT",
        title: "Account Status Updated",
        message: `Your account has been ${status}.`,
        referenceId: tenant.ID,
        referenceType: "user"
    });

    return tenant;
};


/* =========================
   CREATE CARETAKER
========================= */
export const createCaretakerService = async (adminUser, data) => {
    const { fullName, emailAddress, password, contactNumber, userName } = data;

    if (!fullName || !emailAddress || !password || !userName) {
        throw new Error("Missing required fields");
    }

    const existingEmail = await User.findOne({ where: { emailAddress } });
    if (existingEmail) throw new Error("Email already exists");

    const existingUsername = await User.findOne({ where: { userName } });
    if (existingUsername) throw new Error("Username already exists");

    const caretaker = await User.create({
        fullName,
        emailAddress,
        password_hash: password, // 🔥 IMPORTANT
        contactNumber,
        userName,
        role: "caretaker",
        status: "Approved"
    });

    await createActivityLog({
        userId: adminUser.ID,
        role: "admin",
        action: "CREATE_CARETAKER",
        description: `Admin created caretaker: ${caretaker.fullName}`,
        referenceId: caretaker.ID,
        referenceType: "user"
    });

    await createNotification({
        userId: caretaker.ID,
        role: "caretaker",
        type: "ACCOUNT",
        title: "Account Created",
        message: "Your caretaker account has been created.",
        referenceId: caretaker.ID,
        referenceType: "user"
    });

    return caretaker;
};


/* =========================
   CREATE ADMIN
========================= */
export const createAdminService = async (adminUser, data) => {
    const { fullName, emailAddress, password, contactNumber, userName } = data;

    if (!fullName || !emailAddress || !password || !userName) {
        throw new Error("Missing required fields");
    }

    const existingEmail = await User.findOne({ where: { emailAddress } });
    if (existingEmail) throw new Error("Email already exists");

    const existingUsername = await User.findOne({ where: { userName } });
    if (existingUsername) throw new Error("Username already exists");

    const newAdmin = await User.create({
        fullName,
        emailAddress,
        password_hash: password, // 🔥 IMPORTANT
        contactNumber,
        userName,
        role: "admin",
        status: "Approved"
    });

    await createActivityLog({
        userId: adminUser.ID,
        role: "admin",
        action: "CREATE_ADMIN",
        description: `Admin created admin: ${newAdmin.fullName}`,
        referenceId: newAdmin.ID,
        referenceType: "user"
    });

    await createNotification({
        userId: newAdmin.ID,
        role: "admin",
        type: "ACCOUNT",
        title: "Admin Account Created",
        message: "Your admin account has been created.",
        referenceId: newAdmin.ID,
        referenceType: "user"
    });

    return newAdmin;
};


/* =========================
   DELETE USER
========================= */
export const deleteUserService = async (adminUser, userId) => {
    const user = await User.findByPk(userId);

    if (!user) throw new Error("User not found");

    if (!["admin", "caretaker"].includes(user.role)) {
        throw new Error("Only admin or caretaker can be deleted");
    }

    if (user.ID === adminUser.ID) {
        throw new Error("You cannot delete your own account");
    }

    const deletedName = user.fullName;
    const deletedRole = user.role;

    await user.destroy();

    await createActivityLog({
        userId: adminUser.ID,
        role: "admin",
        action: "DELETE_USER",
        description: `Admin deleted ${deletedRole}: ${deletedName}`,
        referenceId: userId,
        referenceType: "user"
    });

    await createNotification({
        role: deletedRole,
        type: "ACCOUNT",
        title: "Account Removed",
        message: `${deletedRole} account (${deletedName}) was removed by admin.`,
        referenceId: userId,
        referenceType: "user"
    });

    return true;
};