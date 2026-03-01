// ================== IMPORTS ==================
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import connectDB from "./src/database/connect.js";
import { initSocket } from "./src/socket.js";
import chatRouter from "./src/routes/chat.js";
import authRouter from "./src/routes/authRoutes.js";
import studentRouter from "./src/routes/studentroutes/studentRoutes.js";
import adminRouter from "./src/routes/adminroutes/index.js";
import sharedRouter from "./src/routes/sharedRoutes/index.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import InternshipsRouter from "./src/routes/InternshipRoutes/InternshipPaymentRoutes.js";
import { submitContactForm } from "./src/controllers/admincontrollers/contactUsMail.js";
import { printRoutes } from "./printRoutes.js";
import { connectCloudinary } from "./src/config/cloudinary.js";

// ================== CONFIG ==================
dotenv.config();
const app = express();
app.set("trust proxy", 1);

// ================== SECURITY ==================

// Security headers
app.use(helmet());

// ================== MIDDLEWARE ==================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging only in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ================== CORS ==================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ================== RATE LIMITING ==================

// 🔐 Strict auth limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts. Try again later.",
});
app.use("/auth", authLimiter);

// ================== ROUTES ==================

app.use("/api/chat", chatRouter);
app.post("/contact", submitContactForm);

app.use("/auth", authRouter);
app.use("/student", studentRouter);
app.use("/admin", adminRouter);
app.use("/api", sharedRouter);
app.use("/api", profileRoutes);
app.use("/api", uploadRoutes);
app.use("/internship", InternshipsRouter);

// ================== HEALTH ==================

app.get("/", (req, res) => {
  res.json({
    message: "Hello! Welcome to Design Career Metrics",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "DCM Server",
    timestamp: new Date().toISOString(),
  });
});

// Print routes in dev
if (process.env.NODE_ENV !== "production") {
  printRoutes(app);
}

// ================== CLOUDINARY ==================

connectCloudinary()
// ================== DATABASE ==================

connectDB(process.env.MONGO_URI);

// ================== SERVER ==================

const PORT = process.env.PORT || 7777;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ================== SOCKET ==================

try {
  initSocket(server);
} catch (err) {
  console.error("⚠️ Socket failed:", err.message);
}

// ================== ERROR HANDLER ==================

app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;