
import express from 'express';
import  verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';
import { getAdminStats } from '../../controllers/admincontrollers/statsControllers.js';

const statsRouter = express.Router();


statsRouter.get('/get-stats', verifyToken, verifyAdmin, getAdminStats);
 
export default statsRouter