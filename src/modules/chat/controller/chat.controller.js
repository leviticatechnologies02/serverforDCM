import chatService from '../service/chat.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';

export const getChatbotStatus = (req, res) => {
  res.json({
    success: true,
    message: 'Chat API is working!',
    timestamp: new Date().toISOString(),
    usage: "Send POST requests to this endpoint with { message: 'your message' }",
    available_models: ['gpt-4o-mini'],
    rate_limit: '7 requests per minute'
  });
};

export const handleChatbotMessage = catchAsync(async (req, res) => {
  const { message, userId } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message is required and cannot be empty'
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Message too long. Maximum 1000 characters allowed.'
    });
  }

  try {
    const result = await chatService.getChatbotReply({ message, userId });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('❌ OpenAI error:', err.message);

    let errorMessage = 'Chatbot service error';
    let statusCode = 500;

    if (err.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (err.status === 401) {
      errorMessage = 'API key invalid or missing.';
      statusCode = 401;
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = 'Request timeout. Please try again.';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
