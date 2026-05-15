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
 transporter.verify().then(() => {
  console.log("SMTP Connection successful");
}).catch((err) => {
  console.error("SMTP Connection failed:", err);
});

export default transporter;