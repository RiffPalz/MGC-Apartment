import { verifyAccessToken } from "../utils/token.js";

// Check if the user is logged in by verifying their token
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check for the Bearer token in headers
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // ✅ FIX: Attach the decoded token to req.user instead of req.auth
    req.user = decoded; 

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Check if the logged-in user has the right role (e.g., 'admin', 'tenant', 'caretaker')
export const authorize = (...roles) => {
  return (req, res, next) => {
    // ✅ FIX: Update the checks to use req.user
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized: Role missing from token" });
    }

    // Block access if the user's role isn't in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: Invalid permissions" });
    }

    next();
  };
};