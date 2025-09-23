import jwt from 'jsonwebtoken'
const verifyToken = (req, res, next) => {
  
  const ACCESS_SECRET = process.env.ACCESS_SECRET;
const token =
  req.cookies.auth_token || // Web
  req.headers.authorization?.split(' ')[1]; // Mobile


  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.userAccount = { user: decoded };
   
    req.authStatus = 'verified';
 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
export default verifyToken