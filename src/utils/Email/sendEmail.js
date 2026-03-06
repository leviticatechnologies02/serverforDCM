// utils/sendEmail.js
import { transporter } from './mailer.js';


export const sendEmail = async ({ to, subject, html, replyTo }) => {
  try {

    const info = await transporter.sendMail({
      from: `Design Career Metrics <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      ...(replyTo && { replyTo })
    });

    console.log("Email sent:", info.messageId);

  } catch (error) {

    console.error("Email sending failed:", error);

  }
};

export const sendStartupTestEmail = async () => {

  try {

    await sendEmail({
      to: "sameershaikzayn@gmail.com", 
      subject: "Server Startup Test Email",
      html: `
        <h2>Server Started Successfully 🚀</h2>
        <p>This is a test email sent when the server started.</p>
        <p>If you received this, SMTP is working.</p>
      `
    });

    console.log("Startup test email sent");

  } catch (error) {

    console.error("Startup email failed:", error);

  }

};