import { getContactEmailHTML, getEnquiryAutoReplyHTML } from "../../utils/Email/generateHTML.js";
import { sendEmail } from "../../utils/Email/sendEmail.js";
import Enquiry from "../../models/Enquiry.js";

export const submitContactForm = async (req, res) => {
  const { name, email, message, mobile, details } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Save enquiry to database
    await Enquiry.create({ name, email, mobile, message, details });

    // Send email to Admin
    await sendEmail({
      to: "info@leviticatechnologies.com",
      html: getContactEmailHTML(name, email, message, mobile),
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`
    });

    // Send Auto-Reply to User
    if (details && details.productTitle) {
      await sendEmail({
        to: email,
        html: getEnquiryAutoReplyHTML(name, details.productTitle),
        subject: `Thank you for your interest in ${details.productTitle}`
      });
    }

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Email send or DB error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};


