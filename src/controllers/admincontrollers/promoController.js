import Promo from "../../models/promocode.js";

/* ================= GET ALL PROMOS ================= */
export const getPromos = async (req, res) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch promos" });
  }
};

/* ================= CREATE PROMO ================= */
export const createPromo = async (req, res) => {
  try {
    const data = req.body;

    // prevent duplicate codes
    const exists = await Promo.findOne({ code: data.code });
    if (exists) {
      return res.status(400).json({ message: "Promo code already exists" });
    }

    const promo = await Promo.create(data);

    res.status(201).json(promo);
  } catch (err) {
    res.status(500).json({ message: "Failed to create promo" });
  }
};

/* ================= UPDATE PROMO ================= */
export const updatePromo = async (req, res) => {
  try {
    const { id } = req.params;

    const promo = await Promo.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!promo) {
      return res.status(404).json({ message: "Promo not found" });
    }

    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: "Failed to update promo" });
  }
};

/* ================= DELETE PROMO ================= */
export const deletePromo = async (req, res) => {
  try {
    const { id } = req.params;

    const promo = await Promo.findByIdAndDelete(id);

    if (!promo) {
      return res.status(404).json({ message: "Promo not found" });
    }

    res.json({ message: "Promo deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete promo" });
  }
};

/* ================= TOGGLE ACTIVE ================= */
export const togglePromo = async (req, res) => {
  try {
    const { id } = req.params;

    const promo = await Promo.findById(id);

    if (!promo) {
      return res.status(404).json({ message: "Promo not found" });
    }

    promo.isActive = !promo.isActive;
    await promo.save();

    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle promo" });
  }
};