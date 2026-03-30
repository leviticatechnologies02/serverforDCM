import express from "express";
import {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
  togglePromo,
} from "../../controllers/admincontrollers/promoController.js";

const router = express.Router();

/* ================= ROUTES ================= */

// GET ALL
router.get("/", getPromos);

// CREATE
router.post("/", createPromo);

// UPDATE
router.patch("/:id", updatePromo);

// DELETE
router.delete("/:id", deletePromo);

// TOGGLE ACTIVE
router.patch("/toggle/:id", togglePromo);

export default router;