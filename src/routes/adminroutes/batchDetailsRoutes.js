import express from 'express'
import { getBatchNames, getBatchDetails, addBatch, getAllBatchesIdAndName } from '../../controllers/admincontrollers/batchDetialsControllers.js'
import verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';

const batchRouter = express.Router();
batchRouter.get('/batchNames', verifyToken, verifyAdmin ,getBatchNames);
batchRouter.get('/:batchName',  verifyToken,verifyAdmin,getBatchDetails);
batchRouter.post('/newbatch',verifyToken,verifyAdmin,addBatch)
batchRouter.get('/allbatchesidandnames',getAllBatchesIdAndName)

export default batchRouter