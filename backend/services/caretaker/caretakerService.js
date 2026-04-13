import User from "../../models/user.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { createNotification } from "../../services/notificationService.js";

export const updateCaretakerProfile = async (caretakerContext, data) => {
  const { instance: user } = caretakerContext;
  const { fullName, contactNumber, emailAddress, userName } = data;
  const changes = [];

  if (fullName && fullName !== user.fullName) {
    user.fullName = fullName.trim();
    changes.push("full name");
  }

  if (contactNumber && contactNumber !== user.contactNumber) {
    user.contactNumber = contactNumber.trim();
    changes.push("contact number");
  }

  if (emailAddress && emailAddress !== user.emailAddress) {
    const emailExists = await User.findOne({ where: { emailAddress } });
    if (emailExists) throw new Error("Email already in use");
    user.emailAddress = emailAddress.trim();
    changes.push("email");
  }

  if (userName && userName !== user.userName) {
    const usernameExists = await User.findOne({ where: { userName } });
    if (usernameExists) throw new Error("Username already in use");
    user.userName = userName.trim();
    changes.push("username");
  }

  await user.save();

  if (changes.length > 0) {
    await createActivityLog({
      userId: user.ID,
      role: "caretaker",
      action: "UPDATE PROFILE",
      description: `You updated your profile: ${changes.join(", ")}.`,
      referenceId: user.ID,
      referenceType: "user",
    });

    await createNotification({
      userId: user.ID,
      role: "caretaker",
      type: "ACCOUNT",
      title: "Profile Updated",
      message: "Your profile has been updated successfully.",
      referenceId: user.ID,
      referenceType: "user",
    });
  }

  return user;
};
