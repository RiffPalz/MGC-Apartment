import User from "../models/user.js";

const createDefaultAdmin = async () => {
  try {
    const email = "mgcbuilding762@gmail.com";
    const plainPassword = "adminMGC123";

    // Search for an existing admin with this email
    let user = await User.findOne({
      where: { emailAddress: email },
    });

    if (!user) {
      // Create the admin account if it doesn't exist
      user = await User.create({
        publicUserID: "PUBLIC-ADMIN-001",
        fullName: "MGC ADMIN",
        emailAddress: email,
        contactNumber: "09291370767",
        userName: "mgc_admin",
        password_hash: plainPassword, // The model hook will handle hashing
        role: "admin",
        status: "Approved",
      });

      console.log("Default admin created successfully");
    } else {
      // Ensure the existing user has the correct admin role and status
      user.role = "admin";
      user.status = "Approved";
      user.password_hash = plainPassword; // re-hash on next save
      await user.save();

      console.log("Default admin already exists (updated role/status)");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
};

export default createDefaultAdmin;