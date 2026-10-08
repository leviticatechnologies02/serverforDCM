import express from 'express';
import {

  getBatchDetails,
  addBatch,

  
  getBatchesByCourseId,
  getBatchesByInternshipId,
  getAllBatches,
  updateBatch,
  deleteBatch
} from '../../controllers/admincontrollers/batchDetialsControllers.js';


const batchRouter = express.Router();

// batchRouter.get('/allbatchNames',  getIdAndBatchNames);
batchRouter.get('/',  getAllBatches);
batchRouter.get('/by-course/:courseId',  getBatchesByCourseId );
batchRouter.get('/by-internship/:internshipDomainId',  getBatchesByInternshipId );
batchRouter.get('/:id',  getBatchDetails);
batchRouter.post('/' ,  addBatch);
batchRouter.put('/:id' ,  updateBatch);
batchRouter.delete('/deleteBatch/:id', deleteBatch);

export default batchRouter