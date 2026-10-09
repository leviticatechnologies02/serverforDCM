import Enquiry from '../../models/Enquiry.js';

export const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, enquiries });
  } catch (error) {
    console.error("Failed to fetch enquiries:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await Enquiry.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete enquiry' });
  }
};
