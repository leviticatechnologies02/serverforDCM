import { Router } from "express";
import {
  getMentors,
  getMentorById,
  addMentor,
  updateMentor,
  deleteMentor
} from "../../controllers/admincontrollers/mentorControllers.js";
import { verifySuperAdmin } from "../../middlewares/verifyMiddleware.js";

const router = Router();

router.get("/", getMentors);
router.get("/:id", getMentorById);
router.post("/", verifySuperAdmin, addMentor);
router.put("/:id", verifySuperAdmin, updateMentor);
router.delete("/:id", verifySuperAdmin, deleteMentor);

export default router;
