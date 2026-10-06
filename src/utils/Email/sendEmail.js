// utils/sendEmail.js
import { Resend } from 'resend';

// Initialize Resend with your API key
// Make sure to add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, replyTo }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Levitica Technologies <info@leviticatechnologies.com>`, // Replace 'info@leviticatechnologies.com' with your verified domain in Resend
      to,
      subject,
      html,
      ...(replyTo && { reply_to: replyTo })
    });

    if (error) {
      console.error("Email sending failed (Resend):", error);
      return;
    }

    console.log("Email sent successfully via Resend:", data.id);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

export const sendStartupTestEmail = async () => {
  try {
    await sendEmail({
      to: "sameershaikzayn@gmail.com", 
      subject: "Server Startup Test Email (Resend)",
      html: `
        <h2>Server Started Successfully 🚀</h2>
        <p>This is a test email sent when the server started.</p>
        <p>If you received this, the Resend API is working perfectly!</p>
      `
    });

    console.log("Startup test email sent");
  } catch (error) {
    console.error("Startup email failed:", error);
  }
};