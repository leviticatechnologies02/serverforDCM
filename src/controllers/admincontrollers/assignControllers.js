import Enrollment from '../../models/Enrollment.js';
import user from '../../models/user.js';
import { getBatchAssignmentEmailHTML } from '../../utils/Email/generateHTML.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';
import mongoose from 'mongoose';

export const getUnassignedEnrollments = async (req, res) => {
  console.log("enrollment getUnassigned")
  try {
    const enrollments = await Enrollment.aggregate([
      // Filter only unassigned courses
      { 
        $project: {
          user: 1,
          enrolledCourses: {
            $filter: {
              input: "$enrolledCourses",
              as: "course",
              cond: { $eq: ["$$course.assigned", false] }
            }
          }
        }
      },
      // Only keep enrollments with at least one unassigned course
      {
        $match: {
          "enrolledCourses.0": { $exists: true }
        }
      },
      // Populate user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      {
        $project: {
          user: 1,
          enrolledCourses: 1
        }
      },

      // Unwind enrolledCourses to populate each course
      { $unwind: "$enrolledCourses" },
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "enrolledCourses.course"
        }
      },
      { $unwind: "$enrolledCourses.course" },
      // Re-group enrolledCourses back into array
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          enrolledCourses: {
            $push: {
              course: "$enrolledCourses.course",
              availability: "$enrolledCourses.availability",
              enrolledAt: "$enrolledCourses.enrolledAt",
              assigned: "$enrolledCourses.assigned",
              batch: "$enrolledCourses.batch"
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          enrolledCourses: 1,
          user: {
            name: "$user.name",
            email: "$user.email",
            role: "$user.role"
            // password and other sensitive fields are excluded
          }
        }
      }

    ]);

    res.status(200).json({ enrollments });
  } catch (error) {
    console.error("Error fetching unassigned enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
};

//this is for assign student to batch



export const assignStudentsToBatch = async (req, res) => {
  const { enrollmentIds, courseId, batchId,courseTitle,batchName } = req.body;
  console.log(req.body, "iam in unassigned controller");
  if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
    return res.status(400).json({ error: 'enrollmentIds must be a non-empty array' });
  }

  const session = await mongoose.startSession();

  try {
    console.log("started")
    await session.withTransaction(async () => {
      // Step 1: Get user IDs before update
      const enrollments = await Enrollment.find(
        { _id: { $in: enrollmentIds } },
        { user: 1 } // Only project user field
      ).session(session);

      const userIds = enrollments.map(e => e.user).filter(Boolean);

      // Step 2: Update enrollments
      const updateResult = await Enrollment.updateMany(
        { _id: { $in: enrollmentIds } },
        {
          $set: {
            'enrolledCourses.$[course].batch': batchId,
            'enrolledCourses.$[course].assigned': true
          }
        },
        {
          arrayFilters: [{ 'course.course': courseId }],
          session
        }
      );
const UserData = await user.find({ _id: { $in: userIds } }).lean().session(session); 
// .lean() returns plain JS objects, faster + lighter than full Mongoose docs

await Promise.allSettled(
  UserData.map(u =>
    sendEmail({
      to: u.email,
      subject: "Batch Assigned Successfully",
      html: getBatchAssignmentEmailHTML(
        u.name,
        courseTitle,
        batchName,
        u.email
      ),
    })
  )
);


      // Step 4: Respond inside transaction
      res.status(200).json({
        message: 'Batch assignment successful',
        totalUpdated: updateResult.modifiedCount,
        totalRequests: enrollmentIds.length
      });
    });
  } catch (error) {
    console.error('Batch assignment error:', error);
    res.status(500).json({ error: 'Failed to assign batches' });
  } finally {
    session.endSession();
  }
};

export const getAssignedEnrollments = async (req, res) => {
  console.log("enrollment getAssigned");
  try {
    const enrollments = await Enrollment.aggregate([
      // Filter only assigned courses
      {
        $project: {
          user: 1,
          enrolledCourses: {
            $filter: {
              input: "$enrolledCourses",
              as: "course",
              cond: { $eq: ["$$course.assigned", true] }
            }
          }
        }
      },
      // Only keep enrollments with at least one assigned course
      {
        $match: {
          "enrolledCourses.0": { $exists: true }
        }
      },
      // Populate user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      {
        $project: {
          user: 1,
          enrolledCourses: 1
        }
      },

      // Unwind enrolledCourses to populate each course
      { $unwind: "$enrolledCourses" },
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "enrolledCourses.course"
        }
      },
      { $unwind: "$enrolledCourses.course" },

      // Optional: Populate batch if needed
      {
        $lookup: {
          from: "batches",
          localField: "enrolledCourses.batch",
          foreignField: "_id",
          as: "enrolledCourses.batch"
        }
      },
      { $unwind: { path: "$enrolledCourses.batch", preserveNullAndEmptyArrays: true } },

      // Re-group enrolledCourses back into array
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          enrolledCourses: {
            $push: {
              course: "$enrolledCourses.course",
              availability: "$enrolledCourses.availability",
              enrolledAt: "$enrolledCourses.enrolledAt",
              assigned: "$enrolledCourses.assigned",
              batch: "$enrolledCourses.batch"
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          enrolledCourses: 1,
          user: {
            name: "$user.name",
            email: "$user.email",
            role: "$user.role"
            // password and other sensitive fields are excluded
          }
        }
      }
    ]);
    console.log(enrollments,"iam from getassigedEnrollment")

    res.status(200).json({ enrollments });
  } catch (error) {
    console.error("Error fetching assigned enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
};
 
import InternshipPayment from '../../models/InternshipPayment.js';

export const getUnassignedInternships = async (req, res) => {
  try {
    const internships = await InternshipPayment.find({ status: 'paid', assigned: false })
      .populate('domainId', 'name')
      .lean();
    res.status(200).json({ internships });
  } catch (error) {
    console.error("Error fetching unassigned internships:", error);
    res.status(500).json({ message: "Failed to fetch unassigned internships" });
  }
};

export const assignInternshipsToBatch = async (req, res) => {
  const { paymentIds, batchId, domainTitle, batchName } = req.body;
  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    return res.status(400).json({ error: 'paymentIds must be a non-empty array' });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Update internships
      const updateResult = await InternshipPayment.updateMany(
        { _id: { $in: paymentIds } },
        {
          $set: {
            batch: batchId,
            assigned: true
          }
        },
        { session }
      );

      const updatedInternships = await InternshipPayment.find({ _id: { $in: paymentIds } }).lean().session(session);

      await Promise.allSettled(
        updatedInternships.map(i =>
          sendEmail({
            to: i.email,
            subject: "Internship Batch Assigned Successfully",
            html: getBatchAssignmentEmailHTML(
              i.name,
              domainTitle || "Internship Program",
              batchName,
              i.email
            ),
          })
        )
      );

      res.status(200).json({
        message: 'Internship batch assignment successful',
        totalUpdated: updateResult.modifiedCount,
        totalRequests: paymentIds.length
      });
    });
  } catch (error) {
    console.error('Internship batch assignment error:', error);
    res.status(500).json({ error: 'Failed to assign internship batches' });
  } finally {
    session.endSession();
  }
};

export const getAssignedInternships = async (req, res) => {
  try {
    const internships = await InternshipPayment.find({ status: 'paid', assigned: true })
      .populate('domainId', 'name')
      .populate('batch', 'batchName')
      .lean();
    res.status(200).json({ internships });
  } catch (error) {
    console.error("Error fetching assigned internships:", error);
    res.status(500).json({ message: "Failed to fetch assigned internships" });
  }
};
