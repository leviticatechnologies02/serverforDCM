// ================== IMPORTS ==================
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "./src/database/connect.js";
import { initSocket } from "./src/socket.js";
import chatRouter from "./src/routes/chat.js";

// Routes
import authRouter from "./src/routes/authRoutes.js";

import paymentRouter from "./src/routes/paymentRoutes/paymentRoutes.js";
import studentRouter from "./src/routes/studentroutes/studentRoutes.js";
import assignRouter from "./src/routes/adminroutes/assignRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import downloadRouter from "./src/routes/downloadRoute.js";
import transactionRouter from "./src/routes/adminroutes/transactionRoutes.js";
import studentEnrollRouter from "./src/routes/studentroutes/stundentenrollRoutes.js";

import cartRouter from "./src/routes/studentroutes/cartRoutes.js";
import liveClassRouter from "./src/routes/adminroutes/liveClassesRoutes.js";
import studentLiveClassRouter from "./src/routes/studentroutes/liveClassStudentRoutes.js";
import statsRouter from "./src/routes/adminroutes/statsRoutes.js";
import createUserRouter from "./src/routes/adminroutes/createUserRoutes.js";
import InternshipsRouter from "./src/routes/InternshipRoutes/InternshipPaymentRoutes.js";
import { submitContactForm } from "./src/controllers/admincontrollers/contactUsMail.js";
import internshipsDomainRouter from "./src/routes/adminroutes/internshipsRoutes.js";

import adminRouter from "./src/routes/adminroutes/index.js";
import { printRoutes, routesAsJson } from "./printRoutes.js";
import sharedRouter from "./src/routes/sharedRoutes/index.js";


// ================== CONFIG ==================
dotenv.config();
const app = express();
app.set("trust proxy", 1);

// ================== MIDDLEWARE ==================

// JSON parsing (DO NOT USE body-parser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan("dev"));
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  "https://designcareermetrics.com",
  "https://dcm-platform.vercel.app",
  'http://192.168.1.48:3000', // Your Flutter app might use this

];

// CORS (SAFE DEBUG MODE)
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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/auth", apiLimiter);

// Debug request logger
app.use((req, res, next) => {
  console.log("🔥 REQUEST:", req.method, req.url);
  next();
});

// ================== ROUTES ==================

// Chat
app.use("/api/chat", chatRouter);


// Contact
app.post("/contact", submitContactForm);

// Main Routers
app.use("/auth", authRouter);

// app.use("/api/notices", noticeRouter);
// app.use("/api", studentRouter);
// app.use("/tasks", taskRouter);
app.use("/admin", adminRouter)
app.use("/api",sharedRouter)
app.use("/api", profileRoutes);
app.use("/internship", InternshipsRouter);
app.use("/api", uploadRoutes);
// app.use("/api/enrollments", downloadRouter);

// app.use("/api", categoriesRouter);
app.use("/api/cart", cartRouter);

app.use("/classes", studentLiveClassRouter);

// ================== TEST & HEALTH ==================

app.get("/", (req, res) => {
  res.json({
    message: "Hello! Welcome to Design Career Metrics",
    timestamp: new Date().toISOString(),
  });
});

app.get("/test", (req, res) => {
  res.send("✅ SERVER TEST OK");
});
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "DCM Server",
    timestamp: new Date().toISOString(),
  });
});

/* ✅ REGISTER __routes FIRST */
if (process.env.NODE_ENV !== "production") {
  app.get("/__routes", (req, res) => {
    const routes = routesAsJson(app);

    res.json({
      service: "DCM Server",
      totalRoutes: routes.length,
      routes,
    });
  });
}

/* ✅ THEN PRINT */
printRoutes(app);

// ================== CLOUDINARY ==================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================== DATABASE ==================
connectDB(process.env.MONGO_URI);

// ================== SERVER ==================
const PORT = process.env.PORT || 7777;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
});

// ================== SOCKET (SAFE MODE) ==================
// COMMENT this if it crashes
try {
  initSocket(server);
} catch (err) {
  console.error("⚠️ Socket failed:", err.message);
}

// ================== ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err);
  res.status(500).json({ error: err.message });
});

export default app;
