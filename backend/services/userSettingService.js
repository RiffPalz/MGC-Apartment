import User from "../models/user.js";
import { createActivityLog } from "../services/activityLogService.js";
import { Op } from "sequelize";

/**
 * GET USER PROFILE
 */
export const getUserProfile = async (userId) => {
    // We fetch the user but explicitly exclude sensitive data like passwords
    const user = await User.findByPk(userId, {
        attributes: { exclude: ["password_hash", "loginToken"] }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

/**
 * UPDATE USER PROFILE
 */
export const updateUserProfile = async (userId, updateData) => {
    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("User not found");
    }

    // 1. Extract ONLY the fields we allow the tenant to change
    const { fullName, emailAddress, contactNumber, userName } = updateData;

    // 2. Uniqueness Checks (If they are changing email or username)
    if (emailAddress && emailAddress !== user.emailAddress) {
        const emailExists = await User.findOne({ where: { emailAddress } });
        if (emailExists) throw new Error("Email is already in use by another account");
    }

    if (userName && userName !== user.userName) {
        const userNameExists = await User.findOne({ where: { userName } });
        if (userNameExists) throw new Error("Username is already taken");
    }

    // 3. Apply the updates
    if (fullName) user.fullName = fullName;
    if (emailAddress) user.emailAddress = emailAddress;
    if (contactNumber) user.contactNumber = contactNumber;
    if (userName) user.userName = userName;

    // 4. Save to database
    await user.save();

    // 5. LOG THE ACTIVITY!
    await createActivityLog({
        userId: user.ID,
        role: user.role, // Dynamically grabs "tenant" 
        action: "UPDATE_PROFILE",
        description: "User updated their personal account information.",
        referenceId: user.ID,
        referenceType: "user"
    });

    // Return the updated data (excluding password stuff)
    return {
        id: user.ID,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        contactNumber: user.contactNumber,
        userName: user.userName
    };
};