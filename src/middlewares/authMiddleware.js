import jwt from 'jsonwebtoken'
import Enrollment from '../models/Enrollment.js';

 async function verifyToken(req, res, next) {
  console.log('Verifying token for request:', req.method, req.url);
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);

  // If credentials are empty, check for token in headers
  if (!req.body.email && !req.body.password) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, create a guest token
      const defaultPayload = { guest: true };
      const token = jwt.sign(defaultPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
      req.authStatus = 'created_guest_token';
      req.user = defaultPayload;
      req.token = token;
      console.log('No token found. Created guest token:', token);
      return next();
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log('Token is valid. User info:', decoded);
      const enrollment = await Enrollment.findOne({ 'user.id': decoded.userId });

          
      
      req.authStatus = 'verified';
      // If token is valid, return user info
      return res.status(200).json({ user: enrollment.user , verified: true });
    } catch (err) {
      req.authStatus = err.name === 'TokenExpiredError' ? 'expired' : 'invalid';
      req.expiredToken = token;
      console.warn(`[JWT] ${req.authStatus} token -`, err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // If credentials are present, continue to next middleware
  next();
}

export default verifyToken;