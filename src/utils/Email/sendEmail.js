// utils/sendEmail.js
import { transporter } from './mailer.js';

export const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `Design Career Metrics ${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });
};