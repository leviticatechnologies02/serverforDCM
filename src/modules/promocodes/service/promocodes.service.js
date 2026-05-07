import Promo from '../../../models/promocode.js';
import ApiError from '../../../utils/ApiError.js';

export class PromocodesService {
  // 1. Admin Promo CRUD
  static async getPromos() {
    const promos = await Promo.find().sort({ createdAt: -1 });
    return promos;
  }

  static async createPromo(data) {
    if (!data.code) {
      throw new ApiError(400, "Promo code is required");
    }

    const exists = await Promo.findOne({ code: data.code });
    if (exists) {
      throw new ApiError(400, "Promo code already exists");
    }

    const promo = await Promo.create(data);
    return promo;
  }

  static async updatePromo(id, data) {
    const promo = await Promo.findByIdAndUpdate(id, data, { new: true });
    if (!promo) {
      throw new ApiError(404, "Promo code not found");
    }
    return promo;
  }

  static async deletePromo(id) {
    const promo = await Promo.findByIdAndDelete(id);
    if (!promo) {
      throw new ApiError(404, "Promo code not found");
    }
    return { message: "Promo deleted successfully" };
  }

  static async togglePromo(id) {
    const promo = await Promo.findById(id);
    if (!promo) {
      throw new ApiError(404, "Promo code not found");
    }

    promo.isActive = !promo.isActive;
    await promo.save();
    return promo;
  }

  // 2. Student Applied Promo Calculations
  static async applyPromo({ code, amount }) {
    if (!code || amount === undefined) {
      throw new ApiError(400, "Promo code and amount are required");
    }

    const promo = await Promo.findOne({ code });
    if (!promo) {
      throw new ApiError(404, "Invalid promo code");
    }

    if (!promo.isActive) {
      throw new ApiError(400, "Promo inactive");
    }

    if (promo.expiryDate && promo.expiryDate < new Date()) {
      throw new ApiError(400, "Promo expired");
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new ApiError(400, "Promo limit reached");
    }

    if (amount < promo.minPurchase) {
      throw new ApiError(400, `Minimum purchase ₹${promo.minPurchase}`);
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

    return {
      code: promo.code,
      discount,
      finalAmount,
      promoId: promo._id
    };
  }
}

export default PromocodesService;
