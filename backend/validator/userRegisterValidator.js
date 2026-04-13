import { validatePassword, validateEmail, validatePhone } from "./userValidator.js";

export const userRegisterValidator = (req, res, next) => {
  const { fullName, email, contactNumber, unitNumber, numberOfTenants, userName, password } = req.body;

  if (!fullName) return res.status(400).json({ message: "Full name is required" });
  if (!email) return res.status(400).json({ message: "Email is required" });
  if (!userName) return res.status(400).json({ message: "Username is required" });
  if (!password) return res.status(400).json({ message: "Password is required" });
  if (!unitNumber) return res.status(400).json({ message: "Unit number is required" });

  const validUnits = [
    101, 102, 103, 104, 105, 106, 107,
    201, 202, 203, 204, 205, 206,
    301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316,
    401, 402, 403, 404, 405, 406, 407, 408,
  ];

  if (!validUnits.includes(Number(unitNumber))) {
    return res.status(400).json({ message: "Invalid unit number for MGC Building" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  if (contactNumber && !validatePhone(contactNumber)) {
    return res.status(400).json({ message: "Invalid Philippine phone number" });
  }

  if (numberOfTenants && Number(numberOfTenants) < 1) {
    return res.status(400).json({ message: "Number of tenants must be at least 1" });
  }

  next();
};
