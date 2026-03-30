import Promo from "../../models/promocode.js";

export const applyPromo = async (req, res) => {
  try {
    const { code, amount } = req.body;

    const promo = await Promo.findOne({ code });

    if (!promo) {
      return res.status(404).json({ message: "Invalid promo code" });
    }

    if (!promo.isActive) {
      return res.status(400).json({ message: "Promo inactive" });
    }

    if (promo.expiryDate < new Date()) {
      return res.status(400).json({ message: "Promo expired" });
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ message: "Promo limit reached" });
    }

    if (amount < promo.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase ₹${promo.minPurchase}`,
      });
    }

    let discount = 0;

    if (promo.discountType === "percentage") {
      discount = (amount * promo.discountValue) / 100;

      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else {
      discount = promo.discountValue;
    }

    const finalAmount = Math.max(0, amount - discount);

    res.json({
      code: promo.code,
      discount,
      finalAmount,
      promoId: promo._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};