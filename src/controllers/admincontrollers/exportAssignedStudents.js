import Enrollment from '../../models/Enrollment.js';
import Batch from '../../models/batch.js';
import ExcelJS from 'exceljs';

export const downloadBatchStudents = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ error: "batchId is required" });
    }

    // Get batch details for naming
    const batch = await Batch.findById(batchId).select("name");
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Fetch assigned students of this batch
    const enrollments = await Enrollment.aggregate([
      {
        $match: {
          "enrolledCourses.batch": batch._id,
          "enrolledCourses.assigned": true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $unwind: "$enrolledCourses" },
      {
        $match: {
          "enrolledCourses.batch": batch._id,
          "enrolledCourses.assigned": true
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "enrolledCourses.course"
        }
      },
      { $unwind: "$enrolledCourses.course" },
      {
        $project: {
          userName: "$user.name",
          userEmail: "$user.email",
          courseName: "$enrolledCourses.course.name",
          enrolledAt: "$enrolledCourses.enrolledAt",
          batch: batch.name
        }
      }
    ]);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Batch Students");

    // Add header row
    worksheet.columns = [
      { header: "Name", key: "userName", width: 25 },
      { header: "Email", key: "userEmail", width: 30 },
      { header: "Course", key: "courseName", width: 30 },
      { header: "Enrolled At", key: "enrolledAt", width: 20 },
      { header: "Batch", key: "batch", width: 20 }
    ];

    // Add rows
    enrollments.forEach((student) => {
      worksheet.addRow({
        userName: student.userName,
        userEmail: student.userEmail,
        courseName: student.courseName,
        enrolledAt: new Date(student.enrolledAt).toLocaleDateString(),
        batch: student.batch
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Batch_${batch.name}_Students.xlsx`
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting batch students:", error);
    res.status(500).json({ error: "Failed to export batch students" });
  }
};
