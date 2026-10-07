import express from "express";
import {
  createInternshipsDomain,
  getAllInternshipsDomains,
  getInternshipsDomainById,
  updateInternshipsDomain,
  deleteInternshipsDomain,
  getInternshipCurriculum,
  updateInternshipCurriculum,
  addCurriculumWeek,
  updateCurriculumWeek,
  deleteCurriculumWeek,
  addSessionToWeek,
  deleteSessionFromWeek,
} from "../../controllers/admincontrollers/internshipsDomainControllers.js";

const internshipsDomainRouter = express.Router();

internshipsDomainRouter.post("/", createInternshipsDomain);
internshipsDomainRouter.get("/:id", getInternshipsDomainById);
internshipsDomainRouter.put("/:id", updateInternshipsDomain);
internshipsDomainRouter.delete("/:id", deleteInternshipsDomain);

// Curriculum CRUD routes
internshipsDomainRouter.get("/:id/curriculum", getInternshipCurriculum);
internshipsDomainRouter.put("/:id/curriculum", updateInternshipCurriculum);
internshipsDomainRouter.patch("/:id/curriculum", updateInternshipCurriculum);
internshipsDomainRouter.post("/:id/curriculum/week", addCurriculumWeek);
internshipsDomainRouter.put("/:id/curriculum/week/:weekId", updateCurriculumWeek);
internshipsDomainRouter.delete("/:id/curriculum/week/:weekId", deleteCurriculumWeek);
internshipsDomainRouter.post("/:id/curriculum/week/:weekId/session", addSessionToWeek);
internshipsDomainRouter.delete("/:id/curriculum/week/:weekId/session/:sessionId", deleteSessionFromWeek);

export default internshipsDomainRouter;
