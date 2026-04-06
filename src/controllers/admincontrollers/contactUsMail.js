import { getContactEmailHTML } from "../../utils/Email/generateHTML.js";
import { sendEmail } from "../../utils/Email/sendEmail.js";

export const submitContactForm = async (req, res) => {
  const { name, email, message,mobile } = req.body;
 

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  
  try {
    await sendEmail({
      to: "leviticatechnologies@gmail.com",
      html: getContactEmailHTML(name, email, message,mobile),
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`
    });
    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};


