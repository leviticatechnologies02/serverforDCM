import express from 'express';
import {

  getBatchDetails,
  addBatch,

  getIdAndBatchNames,
  getBatchesByCourseId,
  getAllBatches,
  updateBatch
} from '../../controllers/admincontrollers/batchDetialsControllers.js';


const batchRouter = express.Router();

// batchRouter.get('/allbatchNames',  getIdAndBatchNames);
batchRouter.get('/',  getAllBatches);
batchRouter.get('/by-course/:courseId',  getBatchesByCourseId );
batchRouter.get('/:id',  getBatchDetails);
batchRouter.post('/' ,  addBatch);
batchRouter.put('/:id' ,  updateBatch);

export default batchRouter