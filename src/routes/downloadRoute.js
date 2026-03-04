import express from "express";
import { downloadBatchStudents } from "../controllers/admincontrollers/exportAssignedStudents.js";
// import { downloadInternshipPaymentsExcel } from "../controllers/admincontrollers/transactionController.js";

const downloadRouter = express.Router();

// Use the correct router instance here
downloadRouter.get("/batch/:batchId", downloadBatchStudents);
// downloadRouter.get("/internship-payments", downloadInternshipPaymentsExcel);
// 
export default downloadRouter;
