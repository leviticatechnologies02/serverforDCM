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

// 🌐 Allowed Origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  '*' // Add deployed frontend domains here
];

dotenv.config();
const app = express();

// 🧠 Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

// 🍪 Cookie + Body Parsing
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🛡️ CORS with credentials
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
      callback(null, true);
    } else {
      console.log(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🕵️ Log incoming origin
app.use((req, res, next) => {
  console.log('📡 Incoming Origin:', req.headers.origin);
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

// 🔥 Razorpay Webhook
app.post('/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  console.log("🔥 Webhook hit");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.status(200).send("OK");
});

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
app.use('/api/admin',statsRouter)
app.use('/api/enrollments', downloadRouter);
app.use('/payments', paymentRouter);
app.use('/api/admin', transactionRouter);
app.use('/api', categoriesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/zoom', liveClassRouter);
app.use('/api/classes', studentLiveClassRouter);

// 🌍 Default route
app.get('/', (req, res) => {
  res.send('Welcome to SAMsWorld API');
});

// ❤️ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// ☁️ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔌 Connect DB
connectDB(process.env.MONGO_URI);

// 🔊 Start Server (HTTPS in production, HTTP in dev)
const PORT = process.env.PORT || 5000;
let server;

// if (process.env.NODE_ENV === 'production') {
//   const httpsOptions = {
//     key: fs.readFileSync('path/to/private-key.pem'),
//     cert: fs.readFileSync('path/to/certificate.pem')
//   };
//   server = https.createServer(httpsOptions, app);
//   server.listen(PORT, () => {
//     console.log(`🔒 HTTPS Server running on port ${PORT}`);
//   });
// } else {
//   server = http.createServer(app);
//   server.listen(PORT, () => {
//     console.log(`🔓 HTTP Server running on http://localhost:${PORT}`);
//   });
// }
app.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});

// 📡 Initialize WebSocket
initSocket(server);

// 🧼 Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});