import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Admin from '../models/admin.js';

async function verifyToken(req, res, next) {
  console.log("🔍 Verifying token for:", req.method, req.url);

  const authHeader = req.headers.authorization;
  console.log("🪪 Authorization header:", authHeader);
  console.log("🧾 Request body:", req.body);

  // Skip token verification on login
  if (req.body?.email && req.body?.password) {
    return next();
  }

  // No token found
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("✅ Token verified:", decoded);

    // 🔍 Find user in either collection
    let account;
  

    if (decoded.role === 'admin') {
      const adminDoc = await Admin.findById( decoded.userId );
      if (!adminDoc) return res.status(404).json({ error: 'Admin not found' });
      const { password, ...sanitizedAdmin } = adminDoc.toObject();

      account = sanitizedAdmin;

    } else {
      const userDoc = await User.findById(decoded.userId);
      if (!userDoc) return res.status(404).json({ error: 'User not found' });

      const { password, ...sanitizedUser } = userDoc.toObject();
      account = sanitizedUser;
    }
console.log(account)
    req.authStatus = 'verified';
    req.userAccount = {
      user: account,
      
    };

    return next();
  } catch (err) {
    req.authStatus = err.name === 'TokenExpiredError' ? 'expired' : 'invalid';
    req.expiredToken = token;
    console.warn(`[JWT] ${req.authStatus}:`, err.message);

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default verifyToken;