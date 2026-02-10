const checkRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

export const verifyAdmin = checkRole(["admin"]);
export const verifyStudent = checkRole(["student"]);
