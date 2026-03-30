import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

dotenv.config();

const router = express.Router();

// ✅ Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 7,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-${req.headers["user-agent"]}`;
  },
  message: {
    success: false,
    error: "Too many requests. Please wait before sending more messages.",
  },
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
      error: "Daily chat limit reached (50 messages).",
    });
  }

  record.count += 1;
  next();
}

// GET endpoint (unchanged)
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chat API is working!",
    timestamp: new Date().toISOString(),
    usage: "Send POST requests to this endpoint with { message: 'your message' }",
    available_models: ["gpt-4o-mini"],
    rate_limit: "7 requests per minute",
  });
});

// POST endpoint (updated to OpenAI)
router.post("/", chatLimiter, dailyLimit, async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required and cannot be empty",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Message too long. Maximum 1000 characters allowed.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key missing");
      return res.status(500).json({
        success: false,
        error: "Chat service configuration error",
      });
    }

    console.log(
      `💬 Chat request from user ${userId || "anonymous"}: ${message.substring(
        0,
        50
      )}...`
    );

    // ✅ Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fast + cost efficient
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant for Levitica Technologies, an educational platform for students and professionals.
          The platform contains courses like Web & App Development, Data Science, and Soft Skills.
          Be concise, helpful, and focused on career advice and learning resources.
          Keep responses under 300 words when possible.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;

    console.log(`🤖 Chat response: ${reply.substring(0, 50)}...`);

    res.json({
      success: true,
      reply,
      model: "gpt-4o-mini",
      usage: completion.usage,
    });
  } catch (err) {
    console.error("❌ OpenAI error:", err.message);

    let errorMessage = "Chatbot service error";
    let statusCode = 500;

    if (err.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again later.";
      statusCode = 429;
    } else if (err.status === 401) {
      errorMessage = "API key invalid or missing.";
      statusCode = 401;
    } else if (err.code === "ETIMEDOUT") {
      errorMessage = "Request timeout. Please try again.";
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

export default router;