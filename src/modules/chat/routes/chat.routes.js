import express from 'express';
import rateLimit from 'express-rate-limit';
import { getChatbotStatus, handleChatbotMessage } from '../controller/chat.controller.js';

const chatRouter = express.Router();

// Rate limiting for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 7,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}-${req.headers['user-agent']}`,
  message: {
    success: false,
    error: 'Too many requests. Please wait before sending more messages.'
  }
});

const dailyUsage = new Map();

function dailyLimit(req, res, next) {
  const key = req.ip;
  const today = new Date().toDateString();

  if (!dailyUsage.has(key)) {
    dailyUsage.set(key, { count: 1, date: today });
    return next();
  }

  const record = dailyUsage.get(key);

  if (record.date !== today) {
    dailyUsage.set(key, { count: 1, date: today });
    return next();
  }

  if (record.count >= 50) {
    return res.status(429).json({
      success: false,
      error: 'Daily chat limit reached (50 messages).'
    });
  }

  record.count += 1;
  next();
}

chatRouter.get('/', getChatbotStatus);
chatRouter.post('/', chatLimiter, dailyLimit, handleChatbotMessage);

export default chatRouter;
