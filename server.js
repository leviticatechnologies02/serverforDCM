import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import fs from 'fs';
import http from 'http';
import https from 'https';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';

import connectDB from './src/database/connect.js';
import { initSocket } from './src/socket.js';
import chatRouter from "./src/routes/chat.js";

// 🌐 Allowed Origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  "https://dcm-platform.vercel.app",
  'http://192.168.1.48:3000', // Your Flutter app might use this
  '*' // Add deployed frontend domains here
];

dotenv.config();
const app = express();

// 🧠 Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

// 🍪 Cookie + Body Parsing - MUST COME BEFORE ROUTES
app.use(cookieParser());
// 🔥 Razorpay Webhook (needs raw body)
app.post('/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  console.log("🔥 Webhook hit");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.status(200).send("OK");
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🛡️ CORS with credentials
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin === 'null' || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🕵️ Log incoming origin and method
app.use((req, res, next) => {
  console.log('📡 Incoming:', req.method, req.url, 'Origin:', req.headers.origin);
  next();
});

// 📊 Request Logging
app.use(morgan('dev'));

// 🛡️ Rate Limiting (especially for auth routes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/auth', apiLimiter);



// ✅ MOUNT CHAT ROUTER (after body parser but before other routes)
app.use("/api/chat", chatRouter);

// -------------------- Routes --------------------
import authRouter from './src/routes/authRoutes.js';
import courseRouter from './src/routes/adminroutes/coursesRoutes.js';
import batchRouter from './src/routes/adminroutes/batchDetailsRoutes.js';
import noticeRouter from './src/routes/adminroutes/noticeRoutes.js';
import taskRouter from './src/routes/adminroutes/taskRoutes.js';
import paymentRouter from './src/routes/paymentRoutes/paymentRoutes.js';
import studentRouter from './src/routes/studentroutes/studentRoutes.js';
import assignRouter from './src/routes/adminroutes/assignRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import downloadRouter from './src/routes/downloadRoute.js';
import transactionRouter from './src/routes/adminroutes/transactionRoutes.js';
import studentEnrollRouter from './src/routes/studentroutes/stundentenrollRoutes.js';
import categoriesRouter from './src/routes/adminroutes/coursesCategoriesRoutes.js';
import cartRouter from './src/routes/studentroutes/cartRoutes.js';
import liveClassRouter from './src/routes/adminroutes/liveClassesRoutes.js';
import studentLiveClassRouter from './src/routes/studentroutes/liveClassStudentRoutes.js';
import statsRouter from './src/routes/adminroutes/statsRoutes.js';
import createUserRouter from './src/routes/adminroutes/createUserRoutes.js';

// Routers
app.use('/auth', authRouter);
app.use('/admin/courses', courseRouter);
app.use('/admin/batchs', batchRouter);
app.use('/student/enroll', studentEnrollRouter);
app.use('/api/notices', noticeRouter);
app.use('/api', studentRouter);
app.use('/tasks', taskRouter);
app.use('/admin/enroll', assignRouter);
app.use('/api', profileRoutes);
app.use('/api', uploadRoutes);
app.use('/api/admin', createUserRouter);
app.use('/api/admin', statsRouter);
app.use('/api/enrollments', downloadRouter);
app.use('/payments', paymentRouter);
app.use('/api/admin', transactionRouter);
app.use('/api', categoriesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/zoom', liveClassRouter);
app.use('/api/classes', studentLiveClassRouter);

// 🌍 Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello! Welcome to Design Career Metrics',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/api/chat',
      health: '/health',
      auth: '/auth',
      courses: '/admin/courses'
    }
  });
});

// ❤️ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'DCM Server',
    version: '1.0.0'
  });
});

// 🔍 Debug route to check all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// ☁️ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔌 Connect DB
connectDB(process.env.MONGO_URI);

// 🔊 Start Server
const PORT = process.env.PORT || 7777; // Changed to 7777 to match your running port

// Create HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
  console.log(`💬 Chat endpoint available at: http://localhost:${PORT}/api/chat`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

// 📡 Initialize WebSocket
initSocket(server);

// 🧼 Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }
  
  // Default error
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 🚨 Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  console.error('At promise:', promise);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// 🚨 Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

export default app;