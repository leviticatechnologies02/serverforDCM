import express from "express";
import { createInternshipsDomain,getAllInternshipsDomains,getInternshipsDomainById,updateInternshipsDomain,deleteInternshipsDomain } from "../../controllers/admincontrollers/internshipsDomainControllers.js";


const internshipsDomainRouter = express.Router();

internshipsDomainRouter.post("/",      createInternshipsDomain);

internshipsDomainRouter.get("/:id",     getInternshipsDomainById);
internshipsDomainRouter.put("/:id",     updateInternshipsDomain);
internshipsDomainRouter.delete("/:id", deleteInternshipsDomain);

export default internshipsDomainRouter;
