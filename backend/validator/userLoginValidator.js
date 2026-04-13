export const userLoginValidator = (req, res, next) => {
  const { userName, password } = req.body;

  if (!userName) return res.status(400).json({ message: "Username is required" });
  if (!password) return res.status(400).json({ message: "Password is required" });

  next();
};
