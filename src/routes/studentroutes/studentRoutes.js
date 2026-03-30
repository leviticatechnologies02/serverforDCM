import express from 'express';
import User from '../../models/user.js';
import exceljs from 'exceljs';
import verifyToken from '../../middlewares/authMiddleware.js';
import studentEnrollRouter from './stundentenrollRoutes.js';
import studentLiveClassRouter from './liveClassStudentRoutes.js';

const studentRouter = express.Router();
studentRouter.use(verifyToken)
studentRouter.use((req, res, next) => {
  console.log("Student:", req.user.email);
  next();
});

studentRouter.use('/enrollments',studentEnrollRouter)
studentRouter.use('/classes',studentLiveClassRouter)




export default studentRouter;