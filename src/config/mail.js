import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // from cPanel
  port: parseInt(process.env.SMTP_PORT) || 465, // default to 465 for secure
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.error('Error occurred while verifying transporter:', error);
  } else {
    console.log('Transporter verified successfully.✅ ');
  }
});