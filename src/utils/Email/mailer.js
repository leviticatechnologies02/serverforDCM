import nodemailer from 'nodemailer';

 export const transporter = nodemailer.createTransport({
  host: 'mail.designcareermetrics.com', // from cPanel
  port: 465,
  secure: true, 
auth: {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS
}

});