import User from "../../models/user.js";
import jwt from "jsonwebtoken";

export const caretakerLogin = async ({ userName, password }) => {
  // Validate that both fields are provided
  if (!userName || !password) {
    throw new Error("Username and password are required");
  }

  // Find the user and ensure they have the 'caretaker' role
  const user = await User.findOne({
    where: { userName: userName, role: "caretaker" },
  });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  // Verify the password hash
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }

  // Generate a JWT for the session
  const token = jwt.sign(
    { id: user.ID, role: "caretaker" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );

  // Save the token to the user record
  user.loginToken = token;
  await user.save();

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