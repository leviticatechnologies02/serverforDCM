
import express from 'express';
import  verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyMiddleware.js';
import { getAdminStats } from '../../controllers/admincontrollers/statsControllers.js';

const statsRouter = express.Router();


statsRouter.get('/get-stats', getAdminStats);
 
export default statsRouter