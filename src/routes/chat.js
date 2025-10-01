import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const router = express.Router();

// Rate limiting for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: 'Too many chat requests, please try again later.',
});

// GET endpoint for testing/health check
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chat API is working!",
    timestamp: new Date().toISOString(),
    usage: "Send POST requests to this endpoint with { message: 'your message' }",
    available_models: ["meta-llama/llama-3.3-70b-instruct:free"],
    rate_limit: "10 requests per minute"
  });
});

// POST endpoint for actual chat functionality
router.post("/", chatLimiter, async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Message is required and cannot be empty" 
      });
    }

    // Validate message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Message too long. Maximum 1000 characters allowed."
      });
    }

    // Check if OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("❌ OpenRouter API key missing");
      return res.status(500).json({
        success: false,
        error: "Chat service configuration error"
      });
    }

    console.log(`💬 Chat request from user ${userId || 'anonymous'}: ${message.substring(0, 50)}...`);

    // Call OpenRouter API with FREE model
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for Design Career Metrics, an educational platform for students and professionals.
            This platform contain course like Web and App Development,Data Science, Soft Skills  
            Be concise, helpful, and focused on design education, career advice, and learning resources.
            Keep responses under 300 words when possible.`
          },
          { 
            role: "user", 
            content: message 
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://designcareermetrics.com",
          "X-Title": "Design Career Metrics"
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error("No response from AI service");
    }

    const reply = response.data.choices[0].message.content;

    console.log(`🤖 Chat response: ${reply.substring(0, 50)}...`);

    res.json({
      success: true,
      reply,
      model: "meta-llama/llama-3.3-70b-instruct:free",
      usage: response.data.usage
    });

  } catch (err) {
    console.error("❌ OpenRouter error:", err.response?.data || err.message);
    
    let errorMessage = "Chatbot service error";
    let statusCode = 500;

    if (err.code === 'ECONNABORTED') {
      errorMessage = "Request timeout. Please try again.";
    } else if (err.response?.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again later.";
      statusCode = 429;
    } else if (err.response?.status === 401) {
      errorMessage = "API key invalid or missing.";
    } else if (err.response?.status === 402) {
      errorMessage = "Payment required. Please check your OpenRouter account.";
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;