import User from "../models/user.js";

const createDefaultCaretaker = async () => {
  try {
    const email = "caretaker@mgcbuilding.com";
    const plainPassword = "crtkr@246";

    let user = await User.findOne({ where: { emailAddress: email } });

    if (!user) {
      user = await User.create({
        publicUserID: "PUBLIC-CARE-001",
        fullName: "MGC CARETAKER",
        emailAddress: email,
        contactNumber: "09201188228",
        userName: "mgc_caretaker",
        password_hash: plainPassword,
        role: "caretaker",
        status: "Approved",
      });
      console.log("Default caretaker created successfully");
    } else {
      user.role = "caretaker";
      user.status = "Approved";
      user.password_hash = plainPassword;
      await user.save();
      console.log("Default caretaker already exists (updated role/status)");
    }
  } catch (error) {
    console.error("Failed to create default caretaker:", error);
  }
};

export default createDefaultCaretaker;
