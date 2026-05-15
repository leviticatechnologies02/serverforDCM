import { Router } from "express";
import {
  getMentors,
  getMentorById,
  addMentor,
  updateMentor,
  deleteMentor
} from "../../controllers/admincontrollers/mentorControllers.js";

const router = Router();

router.get("/", getMentors);
router.get("/:id", getMentorById);
router.post("/", addMentor);
router.put("/:id", updateMentor);
router.delete("/:id", deleteMentor);

export default router;
