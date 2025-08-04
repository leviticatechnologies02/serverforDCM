// middleware/verifyAdmin.js
export const verifyAdmin = (req, res, next) => {
  const {user} = req.userAccount; // assuming user is attached via JWT auth
  console.log(req.userAccount)

  if (user && user.role === 'admin') {
    console.log("ADMIN IS VERIFIED")
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};