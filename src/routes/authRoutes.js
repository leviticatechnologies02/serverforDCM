import express from 'express';
import {signup,login} from '../controllers/authController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/login', verifyToken, login);

export default authRouter;