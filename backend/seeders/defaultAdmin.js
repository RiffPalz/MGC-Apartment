import User from "../models/user.js";

const createDefaultAdmin = async () => {
  try {
    const email = "mgcbuilding762@gmail.com";
    const plainPassword = "adminMGC123";

    let user = await User.findOne({ where: { emailAddress: email } });

    if (!user) {
      user = await User.create({
        publicUserID: "PUBLIC-ADMIN-001",
        fullName: "MGC ADMIN",
        emailAddress: email,
        contactNumber: "09931267680",
        userName: "mgc_admin",
        password_hash: plainPassword,
        role: "admin",
        status: "Approved",
      });
      console.log("Default admin created successfully");
    } else {
      user.role = "admin";
      user.status = "Approved";
      user.password_hash = plainPassword;
      await user.save();
      console.log("Default admin already exists (updated role/status)");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
};

export default createDefaultAdmin;
