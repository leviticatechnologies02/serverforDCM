import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './database/connect.js'; // <-- Import connection

dotenv.config();

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
// app.use(cors({ origin: 'https://testdcmk.netlify.app/' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

connectDB(MONGO_URI); // <-- Use connection

app.get('/', (req, res) => {
  res.send('Welcome to SAMsWorld API');
});

// Use auth routes
import authRouter from './routes/authRoutes.js';
import assignBatchRouter from './routes/adminroutes/assignBatchRoutes.js';
import courseRouter from './routes/adminroutes/coursesRoutes.js';
import batchRouter from './routes/adminroutes/batchDetailsRoutes.js';

app.use('/auth', authRouter);
app.use('/admin', assignBatchRouter);
app.use('/admin/courses',courseRouter)
app.use('/admin/batchs',batchRouter)

app.listen(PORT, () => {
  console.log(`🔊 Server running on http://localhost:${PORT}`);
});