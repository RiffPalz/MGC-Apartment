import { verifyAccessToken } from "../utils/token.js";

/* Authenticate request using Bearer token */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    req.auth = verifyAccessToken(token);

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* Restrict access based on user roles */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return res.status(401).json({ message: "Unauthorized: Role missing" });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
