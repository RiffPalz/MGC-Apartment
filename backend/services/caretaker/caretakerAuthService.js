import User from "../../models/user.js";
import jwt from "jsonwebtoken";
import { createActivityLog } from "../../services/activityLogService.js";

export const caretakerLogin = async ({ userName, password }) => {
  if (!userName || !password) throw new Error("Username and password are required");

  const user = await User.findOne({ where: { userName, role: "caretaker" } });
  if (!user) throw new Error("Invalid username or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Invalid username or password");

  const token = jwt.sign(
    { id: user.ID, role: "caretaker" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );

  user.loginToken = token;
  await user.save();

  await createActivityLog({
    userId: user.ID,
    role: "caretaker",
    action: "LOGIN",
    description: "You logged in to your account.",
    referenceId: user.ID,
    referenceType: "user",
  });

  return {
    accessToken: token,
    caretaker: {
      id: user.ID,
      caretaker_id: user.publicUserID,
      fullName: user.fullName,
      username: user.userName,
      role: "caretaker",
    },
  };
};
