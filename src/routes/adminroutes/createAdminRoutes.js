import express from "express";
import { createAdmin, getAdminById, getAllAdmins, updateAdmin, deleteAdmin } from "../../controllers/admincontrollers/createAdminControllers.js";


const router = express.Router();

router.post("/", createAdmin);
router.get("/", getAllAdmins);
router.get("/:id", getAdminById);
router.put("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);

export default router;