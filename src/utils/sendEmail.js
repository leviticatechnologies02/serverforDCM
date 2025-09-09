import nodemailer from 'nodemailer';
import { getVerificationEmailHTML } from './generateHTML.js';

const sendEmail = async (to, subject, token,name) => {
    console.log(to)
    console.log(subject)
   
    console.log( process.env.EMAIL_USER)
    
    const html=getVerificationEmailHTML(name,token ,to)
  const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    secure:true,
     port:465,
    service: 'Gmail', // or 'Yahoo', 'Outlook', etc.
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASS  // your email password or app password
    }
  });

  await transporter.sendMail({
    from: `Iam Iron Man <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html:html
  });
};

export default sendEmail;