import crypto from 'crypto';
import Token from '../models/token.js';
import mongoose from "mongoose";

const OTP_LENGTH = 4;
const DEFAULT_TTL_MIN = 10;

// Generate numeric OTP
export const generateOTP = (length = OTP_LENGTH) => {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};

// Hash OTP
export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

// Create & store OTP
export const createOTP = async ({
  userId,
  type,
  ttlMin = DEFAULT_TTL_MIN,
}) => {
  const otp = generateOTP();
  const hashedOTP = hashOTP(otp);


  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

  // Cleanup previous OTPs of same type
  await Token.deleteMany({ userId, type });

  await Token.create({
    userId,
    token: hashedOTP,
    type,
    expiresAt,
  });


  return otp; // raw OTP returned for email/SMS
};

// Verify OTP
export const verifyOTP = async ({
  userId,
  otp,
  type,
}) => {

  

  const hashedOTP = hashOTP(otp);
 
  const token = await Token.findOne({
    userId,
    token: hashedOTP,
    type,
    expiresAt: { $gt: new Date() },
  });

  if (!token) return false;

  // Invalidate OTP after success
  await Token.deleteMany({ userId, type });

  return true;
};
