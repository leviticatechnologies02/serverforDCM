
import http from 'http';
import express from 'express';
import connectDB from './src/database/connect.js';
import { initSocket } from './src/socket.js';
import { PaymentsService } from './src/modules/payments/index.js';
import { InternshipsService } from './src/modules/internships/index.js';
import {connectCloudinary} from './src/config/cloudinary.js';
import app from './src/app.js';
import { printRoutes } from './printRoutes.js';

// Register raw body webhook endpoints before body parsers in app
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await PaymentsService.handleWebhook({ signature, rawBody: req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/api/internship/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await InternshipsService.handleWebhook({ signature, body: req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Start DB and server
await connectDB(process.env.MONGO_URI)
connectCloudinary && connectCloudinary();

printRoutes(app)

const PORT = process.env.PORT || 7777;
const server = http.createServer(app);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

try {
  initSocket(server);
} catch (err) {
  console.error('⚠️ Socket failed:', err.message);
}

export default server;