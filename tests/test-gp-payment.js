import mongoose from 'mongoose';
import Course from '../src/models/courses.js';
import Payment from '../src/models/payments.js';
import Enrollment from '../src/models/Enrollment.js';
import { enrollInCourses } from '../src/controllers/studentcontrollers/coursesEnrollControllers.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function runTest() {
  try {
    console.log("🚀 Starting Google Play Payment Logic Test...");

    // 1. Connect to DB
    if (!MONGO_URI) throw new Error("MONGO_URI not found in .env");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 2. Setup Dummy Data
    const dummyUserId = new mongoose.Types.ObjectId();
    const dummyCourseId = new mongoose.Types.ObjectId();
    const googleProductId = `course_${dummyCourseId}`;

    console.log(`\n--- Setup ---`);
    console.log(`Dummy User ID: ${dummyUserId}`);
    console.log(`Dummy Course ID: ${dummyCourseId}`);
    console.log(`Google Product ID: ${googleProductId}`);

    // Create Dummy Course
    const course = await Course.create({
      _id: dummyCourseId,
      name: "Test GP Course",
      category: "Test",
      price: 999,
      googleProductId: googleProductId
    });
    console.log("✅ Dummy Course Created");

    // 3. Simulate the Logic from googlePlayPaymentController.js
    console.log(`\n--- Simulating Logic ---`);

    const productId = googleProductId; // The ID we got from Google
    const purchaseToken = "test_token_" + Date.now();
    const orderId = "GPA.1234-5678-9012-34567";

    // Lookup Logic (the part I wrote)
    const courseIdFromProduct = productId.startsWith('course_') ? productId.replace('course_', '') : null;
    let foundCourse;
    if (courseIdFromProduct && mongoose.Types.ObjectId.isValid(courseIdFromProduct)) {
      foundCourse = await Course.findById(courseIdFromProduct);
    }

    if (!foundCourse) {
      foundCourse = await Course.findOne({ googleProductId: productId });
    }

    if (foundCourse) {
      console.log(`✅ Course found successfully: ${foundCourse.name}`);

      // Create Payment
      const payment = await Payment.findOneAndUpdate(
        { orderId: orderId },
        {
          $set: {
            userId: dummyUserId,
            courseIds: [foundCourse._id],
            amount: 0,
            amountInRupees: 0,
            currency: 'INR',
            status: 'paid',
            paymentProvider: 'google_play',
            paymentMode: 'google_play',
            isEnrolled: true
          }
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Payment record created: ${payment._id}`);

      // Enroll User
      await enrollInCourses({
        paymentId: payment._id,
        userId: dummyUserId,
        courseId: foundCourse._id
      });
      console.log(`✅ User enrolled in course`);

      // 4. Verify Results
      const enrollment = await Enrollment.findOne({ user: dummyUserId });
      const isEnrolled = enrollment?.enrolledCourses.some(c => c.course.toString() === dummyCourseId.toString());

      if (isEnrolled) {
        console.log(`\n🏆 TEST PASSED: User is successfully enrolled!`);
      } else {
        console.log(`\n❌ TEST FAILED: Enrollment record not found.`);
      }
    } else {
      console.log("❌ TEST FAILED: Course not found during lookup.");
    }

    // Cleanup
    console.log(`\n--- Cleaning Up ---`);
    await Course.findByIdAndDelete(dummyCourseId);
    if (foundCourse) {
      const p = await Payment.findOne({ orderId: orderId });
      if (p) await Payment.findByIdAndDelete(p._id);
    }
    await Enrollment.findOneAndDelete({ user: dummyUserId });
    console.log("✅ Cleanup completed");

  } catch (error) {
    console.error("\n❌ Test errored:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from DB");
  }
}

runTest();
