export const validateGooglePlayVerify = (req, res, next) => {
  const { userId, packageName, courseId, purchaseToken } = req.body;
  if (!userId || !packageName || !courseId || !purchaseToken) {
    return res.status(400).json({ error: 'Missing required fields: userId, packageName, courseId, purchaseToken' });
  }
  // Basic types check
  if (typeof userId !== 'string' || typeof packageName !== 'string' || typeof courseId !== 'string' || typeof purchaseToken !== 'string') {
    return res.status(400).json({ error: 'Invalid field types' });
  }
  next();
};
