import { verifyAccessToken } from "../utils/token.js";

/* AUTHENTICATE USER */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Validate Bearer token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // Attach decoded token to request
    req.user = decoded;

    next();

  } catch (error) {
  
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

/* AUTHORIZE USER ROLE */
export const authorize = (...roles) => {
  return (req, res, next) => {

    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: "Unauthorized: Role missing from token"
      });
    }

    // Check if user role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: Invalid permissions"
      });
    }

    next();
  };
};