import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';             // ⬅️ Import http
import { Server } from 'socket.io';  // ⬅️ Import socket.io
import connectDB from './database/connect.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app); // ⬅️ Create HTTP server

// 🌐 Allow known web origins + mobile-origin (null)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  '*' // Add your deployed frontend if needed
];

// 🛠️ CORS config with mobile support
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
      callback(null, true);
    } else {
      console.log(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 🕵️ Log incoming origin for debugging
app.use((req, res, next) => {
  console.log('📡 Incoming Origin:', req.headers.origin);
  next();
});

// 📡 Setup Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins (adjust if needed)
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("✅ New WebSocket client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Export function to emit notices
export const notifyNewNotice = (notice) => {
  io.emit("newNotice", notice);
};

// 📦 Razorpay Webhook
app.post('/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  console.log("🔥 Webhook hit");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.status(200).send("OK");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;


connectDB(MONGO_URI);

app.get('/', (req, res) => {
  res.send('Welcome to SAMsWorld API');
});

// 🧭 Routes
import authRouter from './routes/authRoutes.js';
import assignBatchRouter from './routes/adminroutes/assignBatchRoutes.js';
import courseRouter from './routes/adminroutes/coursesRoutes.js';
import batchRouter from './routes/adminroutes/batchDetailsRoutes.js';
import noticeRouter from './routes/adminroutes/noticeRoutes.js';
import taskRouter from './routes/adminroutes/taskRoutes.js';
import paymentRouter from './routes/paymentRoutes/paymentRoutes.js';
import studentRouter from './routes/studentroutes/studentRoutes.js';
import assignRouter from './routes/adminroutes/assignRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { v2 as cloudinary } from "cloudinary";
import downloadRouter from "./routes/downloadRoute.js";
import transactionRouter from './routes/adminroutes/transactionRoutes.js'; 
import liveClassRoutes from "./routes/liveClassRoutes.js";
import studentEnrollRouter from './routes/studentroutes/stundentenrollRoutes.js';
import categoriesRouter from './routes/adminroutes/coursesCategoriesRoutes.js';

app.use('/auth', authRouter);
app.use('/admin', assignBatchRouter);
app.use('/admin/courses', courseRouter);
app.use('/admin/batchs', batchRouter);
app.use('/student/enroll', studentEnrollRouter);
app.use('/api/notices', noticeRouter);
app.use('/api', studentRouter);
app.use('/tasks', taskRouter);
app.use('/admin/enroll', assignRouter);
app.use('/api', profileRoutes);
app.use('/api', uploadRoutes);
app.use("/api/enrollments", downloadRouter); 
app.use('/payments', paymentRouter);
app.use("/api/live-class", liveClassRoutes);
app.use('/api/admin', transactionRouter);
app.use('/api', categoriesRouter);

// Middleware
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🚀 Start HTTP + WebSocket server
server.listen(PORT, () => {
  console.log(`🔊 Server running on http://localhost:${PORT}`);
});
