import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (payload) => {
  if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET in environment variables");
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
};

export const verifyAccessToken = (token) => {
  if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET in environment variables");
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const generateLoginToken = () => crypto.randomBytes(32).toString("hex");

export const generatePasswordResetToken = () => crypto.randomBytes(32).toString("hex");

export default {
  generateAccessToken,
  verifyAccessToken,
  generateLoginToken,
  generatePasswordResetToken,
};
