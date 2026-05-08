import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware.js';

// Modular Imports
import { authRouter } from './modules/auth/index.js';
import { usersRouter, usersAdminRouter } from './modules/users/index.js';
import { adminRouter } from './modules/admin/index.js';
import { studentsRouter, studentReportsAdminRouter, cartRouter } from './modules/students/index.js';
import { mentorsRouter } from './modules/mentors/index.js';
import { coursesRouter, coursesAdminRouter } from './modules/courses/index.js';
import { paymentsRouter } from './modules/payments/index.js';
import { internshipsRouter, internshipsAdminRouter } from './modules/internships/index.js';
import { liveClassesRouter } from './modules/live-classes/index.js';
import { promocodesRouter, promocodesAdminRouter } from './modules/promocodes/index.js';
import { tasksRouter } from './modules/tasks/index.js';
import { notificationsRouter } from './modules/notifications/index.js';
import { chatRouter } from './modules/chat/index.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet());
app.use(hpp());
app.use(cookieParser());
// CORS
const allowedOrigins = [process.env.FRONTEND_URL, process.env.CLIENT_URL].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);


// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Webhook raw body routes are registered in server.js before body parsers in app

// ==================== ROUTE DISPATCHING ====================

// 1. Auth & Profiles
app.use('/auth', authRouter);
app.use('/api', usersRouter);

// 2. Student Enrollments & Upcoming/Join Classes
app.use('/student', studentsRouter);
app.use('/student', liveClassesRouter);

// 3. Shopping Cart
app.use('/api/cart', cartRouter);

// 4. Public Modules
app.use('/api/courses', coursesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/notices', notificationsRouter);
app.use('/api/promo', promocodesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/chat', chatRouter);

// 5. Internships Domain List & checkout
app.use('/internship', internshipsRouter);

// 6. Admin Consolidated Routers (preserving exact legacy paths)
app.use('/admin', adminRouter);
app.use('/admin/courses', coursesAdminRouter);
app.use('/admin/student-reports', studentReportsAdminRouter);
app.use('/admin/user', usersAdminRouter);
app.use('/admin/users', usersAdminRouter);
app.use('/admin/internshipsdomain', internshipsAdminRouter);
app.use('/admin/promocode', promocodesAdminRouter);
app.use('/admin/mentors', mentorsRouter);
app.use('/admin/transactions', paymentsRouter);
app.use('/admin', liveClassesRouter);

// Health check endpoints
app.get('/', (req, res) => res.json({ message: 'Hello! Welcome to Levitica Technologies', timestamp: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'DCM Server', timestamp: new Date().toISOString() }));

// Error handler (should be last)
app.use(errorHandler);

export default app;
