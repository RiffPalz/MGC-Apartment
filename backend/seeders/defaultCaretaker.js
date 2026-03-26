import User from "../models/user.js";

const createDefaultCaretaker = async () => {
  try {
    const email = "caretaker@mgcbuilding.com";
    const plainPassword = "crtkr@246";

    // Check if the caretaker email is already in the database
    let user = await User.findOne({
      where: { emailAddress: email },
    });

    if (!user) {
      // Create the caretaker account if it doesn't exist
      user = await User.create({
        publicUserID: "PUBLIC-CARE-001",
        fullName: "MGC CARETAKER",
        emailAddress: email,
        contactNumber: "09180000000",
        userName: "mgc_caretaker",
        password_hash: plainPassword,
        role: "caretaker",
        status: "Approved",
      });

      console.log("✅ Default caretaker created successfully");
    } else {
      // Update the existing user to ensure they have caretaker permissions
      user.role = "caretaker";
      user.status = "Approved";
      user.password_hash = plainPassword; // re-hash on next save
      await user.save();

      console.log("✅ Default caretaker already exists (updated role/status)");
    }
  } catch (error) {
    console.error("❌ Failed to create default caretaker:", error);
  }
};

export default createDefaultCaretaker;