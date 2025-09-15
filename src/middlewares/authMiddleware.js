import jwt from 'jsonwebtoken'
const verifyToken = (req, res, next) => {
  console.log(req,"rei")
  const ACCESS_SECRET = process.env.ACCESS_SECRET;
  console.log(ACCESS_SECRET,"iam access token")

  const token = req.cookies.auth_token;
 console.log(token,"token")
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.userAccount = { user: decoded };
    req.authStatus = 'verified';
    console.log(decoded,"iam decoded")
   
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
export default verifyToken