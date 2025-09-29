import express from 'express';
import User from '../../models/user.js';
import exceljs from 'exceljs';

const router = express.Router();

// Original JSON route
router.get('/students', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = { role: 'student',emailVerified:true};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    const students = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit).select('_id name mobile email emailVerified');
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Advanced Excel download with filters
router.get('/students/download', async (req, res) => {
  try {
    const {  startDate, endDate } = req.query;
    
    let query = { role: 'student',emailVerified:true };
    

    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const students = await User.find(query).sort({ createdAt: -1 });
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'No students found matching the criteria' });
    }
    
    const workbook = new exceljs.Workbook();
    
    // Main data sheet
    const dataSheet = workbook.addWorksheet('Students Data');
    
    // Define columns
    dataSheet.columns = [
      { header: 'SR No.', key: 'serial', width: 8 },
      { header: 'Student ID', key: '_id', width: 25 },
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Mobile Number', key: 'mobile', width: 15 },
      { header: 'Email Verified', key: 'emailVerified', width: 15 },
      { header: 'Account Created', key: 'createdAt', width: 20 },
      { header: 'Last Updated', key: 'updatedAt', width: 20 }
    ];
    
    // Add data with serial numbers
    students.forEach((student, index) => {
      dataSheet.addRow({
        serial: index + 1,
        _id: student._id.toString(),
        name: student.name || 'Not Provided',
        email: student.email,
        mobile: student.mobile || 'Not Provided',
        emailVerified: student.emailVerified ? 'Verified' : 'Pending',
        createdAt: student.createdAt.toLocaleDateString('en-IN'),
        updatedAt: student.updatedAt.toLocaleDateString('en-IN')
      });
    });
    
    // Style the data sheet
    const dataHeader = dataSheet.getRow(1);
    dataHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    dataHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5496' }
    };
    dataHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    
    const totalStudents = students.length;
    const verifiedStudents = students.filter(s => s.emailVerified).length;
    const studentsWithMobile = students.filter(s => s.mobile).length;
    const studentsWithName = students.filter(s => s.name).length;
    
    summarySheet.addRow({ metric: 'Total Students', value: totalStudents });
    summarySheet.addRow({ metric: 'Email Verified', value: verifiedStudents });
    summarySheet.addRow({ metric: 'With Mobile Number', value: studentsWithMobile });
    summarySheet.addRow({ metric: 'With Name Provided', value: studentsWithName });
    summarySheet.addRow({ metric: 'Verification Rate', value: `${((verifiedStudents / totalStudents) * 100).toFixed(1)}%` });
    summarySheet.addRow({ metric: 'Report Generated', value: new Date().toLocaleString() });
    
    // Style summary sheet
    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    
    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=students_report_${timestamp}.xlsx`);
    
    // Send the file
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

export default router;