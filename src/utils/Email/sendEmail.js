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
      return { success: false, error };
    }

    console.log("Email sent successfully via Resend to:", to, "ID:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
};