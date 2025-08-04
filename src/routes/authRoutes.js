import express from 'express';
import {signup,login,verifyAuthToken } from '../controllers/authController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/login',  login);
authRouter.get('/verify', verifyToken, verifyAuthToken);

export default authRouter;