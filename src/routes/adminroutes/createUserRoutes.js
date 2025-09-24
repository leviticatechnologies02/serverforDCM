
import express from 'express';
import  verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';
import { createUser } from '../../controllers/admincontrollers/createUserControllers.js';

const createUserRouter = express.Router();


createUserRouter.post('/create-user', verifyToken, verifyAdmin, createUser);
 
export default createUserRouter