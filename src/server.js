import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './database/connect.js';

dotenv.config();

const app = express();

// 🌐 Allow known web origins + mobile-origin (null)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://designcarrermetrics.com',
  '*' // Add your deployed frontend if needed
];
  origin: "*", 
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT;
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
import enrollRouter from './routes/studentroutes/enrollmentsRoutes.js';
import noticeRouter from './routes/adminroutes/noticeRoutes.js';
import taskRouter from './routes/adminroutes/taskRoutes.js';

import assignRouter from './routes/adminroutes/assignRoutes.js';


app.use('/auth', authRouter);
app.use('/admin', assignBatchRouter);
app.use('/admin/courses', courseRouter);
app.use('/admin/batchs', batchRouter);
app.use('/student/enroll', enrollRouter);
app.use('/api/notices', noticeRouter);
app.use('/tasks', taskRouter);
app.use('/admin/enroll',assignRouter)

app.listen(PORT, () => {
  console.log(`🔊 Server running on http://localhost:${PORT}`);
});