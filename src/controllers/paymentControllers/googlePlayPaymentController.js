import {
  verifyProductPurchase,
  acknowledgeProductPurchase
} from '../../service/googlePlayService.js';

import Purchase from'../../models/googlePurchase.js';
import Course from '../../models/courses.js';
import Payment from '../../models/payments.js';
import { enrollInCourses } from '../studentcontrollers/coursesEnrollControllers.js';
import mongoose from 'mongoose';

/**
 * Verify Google Play in-app purchase
 */
export const verifyGooglePurchaseController = async (req, res) => {
  try {
    const { packageName, productId, purchaseToken } = req.body;

    // User from auth middleware
    const userId = req.user?._id;

    /**
     * Basic validation
     */
    if (!packageName || !productId || !purchaseToken) {
      return res.status(400).json({
        success: false,
        message:
          'packageName, productId and purchaseToken are required'
      });
    }

    /**
     * Prevent duplicate processing
     */
    const existingPurchase = await Purchase.findOne({
      purchaseToken
    });

    if (existingPurchase) {
      return res.status(200).json({
        success: true,
        message: 'Purchase already verified',
        verified: existingPurchase.verified,
        data: existingPurchase
      });
    }

    /**
     * Verify purchase with Google Play
     */
    const purchaseData = await verifyProductPurchase({
      packageName,
      productId,
      purchaseToken
    });

    /**
     * purchaseState:
     * 0 = Purchased
     * 1 = Canceled
     * 2 = Pending
     */
    const isPurchased =
      purchaseData.purchaseState === 0;

    /**
     * Acknowledge purchase if needed
     */
    if (
      isPurchased &&
      purchaseData.acknowledgementState === 0
    ) {
      await acknowledgeProductPurchase({
        packageName,
        productId,
        purchaseToken
      });
    }

    /**
     * Save purchase in DB
     */
    const savedPurchase = await Purchase.create({
      userId,
      platform: 'android',

      packageName,
      productId,
      purchaseToken,

      orderId: purchaseData.orderId || null,

      purchaseState: purchaseData.purchaseState,

      acknowledgementState:
        purchaseData.acknowledgementState,

      consumptionState:
        purchaseData.consumptionState,

      purchaseTimeMillis:
        purchaseData.purchaseTimeMillis,

      verified: isPurchased,

      rawResponse: purchaseData
    });

    /**
     * Grant entitlement/premium access here
     */
    if (isPurchased) {
      // 1. Find the course linked to this productId
      // Try to extract courseId if format is 'course_mongoid'
      const courseIdFromProduct = productId.startsWith('course_') ? productId.replace('course_', '') : null;
      
      let course;
      if (courseIdFromProduct && mongoose.Types.ObjectId.isValid(courseIdFromProduct)) {
        course = await Course.findById(courseIdFromProduct);
      }

      // Fallback: search by explicit mapping if not found via ID parsing
      if (!course) {
        course = await Course.findOne({ googleProductId: productId });
      }
      
      if (course) {
        // 2. Create/Update a record in the unified Payment model
        // We use findOneAndUpdate to handle potential webhook/sync race conditions
        const payment = await Payment.findOneAndUpdate(
          { orderId: purchaseData.orderId || `GP_${purchaseToken.slice(-10)}` },
          {
            $set: {
              userId,
              courseIds: [course._id],
              amount: 0, // In-app purchase amounts are handled by Google
              amountInRupees: 0, 
              currency: 'INR',
              status: 'paid',
              paymentProvider: 'google_play',
              paymentMode: 'google_play',
              googlePurchaseId: savedPurchase._id,
              isEnrolled: true,
              meta: purchaseData
            }
          },
          { upsert: true, new: true }
        );

        // 3. Enroll the user in the course
        await enrollInCourses({
          paymentId: payment._id,
          userId,
          courseId: course._id
        });

        console.log(`✅ User ${userId} enrolled in course ${course._id} via Google Play`);
      } else {
        console.warn(`⚠️ No course found for googleProductId: ${productId}`);
      }
    }

    return res.status(200).json({
      success: true,
      verified: isPurchased,
      data: savedPurchase
    });

  } catch (error) {
    console.error(
      'Google Play verification error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Purchase verification failed',
      error: error.message
    });
  }
};