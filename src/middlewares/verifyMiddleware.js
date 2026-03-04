const checkRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

export const verifyAdmin = checkRole(["admin","superadmin"]);
export const verifySuperAdmin = checkRole(["superadmin"]);
export const verifyStudent = checkRole(["student"]);
