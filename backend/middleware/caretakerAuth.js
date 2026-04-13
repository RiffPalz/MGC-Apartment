import jwt from "jsonwebtoken";
import User from "../models/user.js";

const caretakerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing or malformed.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "caretaker") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const user = await User.findByPk(decoded.id);

    if (!user || user.role !== "caretaker") {
      return res.status(401).json({ success: false, message: "Caretaker not found" });
    }

    req.caretaker = {
      instance: user,
      id: user.ID,
      caretaker_id: user.publicUserID,
      fullName: user.fullName,
      contactNumber: user.contactNumber,
      username: user.userName,
      emailAddress: user.emailAddress,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Caretaker Auth Middleware Error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default caretakerAuth;
