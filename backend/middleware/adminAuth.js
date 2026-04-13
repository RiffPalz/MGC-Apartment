import jwt from "jsonwebtoken";
import User from "../models/user.js";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access token is required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Invalid token payload." });
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Admin account not found." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access only." });
    }

    req.admin = {
      instance: user,
      id: user.ID,
      adminID: user.publicUserID,
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      contactNumber: user.contactNumber,
      username: user.userName,
    };

    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

export default adminAuth;
