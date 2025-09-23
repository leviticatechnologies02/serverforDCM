import express from 'express';
import {

  getBatchDetails,
  addBatch,

  getIdAndBatchNames
} from '../../controllers/admincontrollers/batchDetialsControllers.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';

const batchRouter = express.Router();

batchRouter.get('/allbatchNames', verifyToken, verifyAdmin, getIdAndBatchNames);
batchRouter.get('/:id', verifyToken, verifyAdmin, getBatchDetails);
batchRouter.post('/newbatch' , verifyToken, verifyAdmin, addBatch);

export default batchRouter