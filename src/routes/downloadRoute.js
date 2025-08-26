import express from "express";
import { downloadBatchStudents } from "../controllers/admincontrollers/exportAssignedStudents.js";

const downloadRouter = express.Router();

// Use the correct router instance here
downloadRouter.get("/download/batch/:batchId", downloadBatchStudents);

export default downloadRouter;
