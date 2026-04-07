import bcrypt from "bcryptjs";
import User from "../../models/user.js";
import { sendMail } from "../../utils/mailer.js";
import { generateVerificationCode } from "../../utils/codeGenerator.js";
import { loginEmailTemplate } from "../../utils/emailTemplate.js";
import { createActivityLog } from "../../services/activityLogService.js";

/* ADMIN LOGIN – SEND OTP */
export const adminLogin = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Find admin user by email
    const user = await User.findOne({ where: { emailAddress: email } });
    if (!user || user.role !== "admin") {
        throw new Error("Invalid email or password");
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    // Generate OTP (expires in 5 minutes)
    const verificationCode = generateVerificationCode();
    user.verification_code = verificationCode;
    user.code_expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Send OTP via email
    await sendMail({
        to: user.emailAddress,
        subject: "Admin Login Verification Code",
        html: loginEmailTemplate(user.userName, verificationCode),
    });

    return {
        message: "Verification code sent to admin email",
        adminId: user.ID, // Primary key for OTP verification
    };
};

/* VERIFY ADMIN OTP */
export const verifyAdminOtp = async ({ adminId, verificationCode }) => {
    const user = await User.findByPk(adminId);
    if (!user || user.role !== "admin") throw new Error("Admin account not found");

    // Check OTP validity
    if (!user.verification_code || user.verification_code !== verificationCode) {
        throw new Error("Invalid verification code");
    }

    if (!user.code_expires_at || user.code_expires_at < new Date()) {
        throw new Error("Verification code has expired");
    }

    // Clear OTP after successful verification
    user.verification_code = null;
    user.code_expires_at = null;
    await user.save();

    // Generate access token
    const { generateAccessToken } = await import("../../utils/token.js");
    const accessToken = generateAccessToken({ id: user.ID, role: "admin" });

    await createActivityLog({
        userId: user.ID,
        role: "admin",
        action: "LOGIN",
        description: "You logged in to the admin portal.",
        referenceId: user.ID,
        referenceType: "user",
    });

    return {
        message: "Admin login successful",
        accessToken,
        admin: {
            id: user.ID,
            adminID: user.publicUserID,
            username: user.userName,
            emailAddress: user.emailAddress,
            role: "admin",
        },
    };
};

/* RESEND ADMIN OTP */
export const resendAdminCode = async (adminId) => {
    const user = await User.findByPk(adminId);
    if (!user || user.role !== "admin") throw new Error("Admin not found");

    const code = generateVerificationCode();
    user.verification_code = code;
    user.code_expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendMail({
        to: user.emailAddress,
        subject: "Your New Login Verification Code",
        html: loginEmailTemplate(user.userName, code),
    });
};