// utils/authEmails.js
import { sendEmail } from './Email/sendEmail.js';
import { getVerificationEmailHTML, getPasswordResetEmailHTML } from './Email/generateHTML.js';

export const sendVerificaionEmail = async (to, verifyUrl, name) => {
    const subject = 'Verify Your Email';
  const html = getVerificationEmailHTML(name, verifyUrl, to);
  await sendEmail({ to, subject, html });
};

export const sendPasswordResetEmail = async ({to, name, resetUrl}) => {
  const subject = 'Reset Your Password';
  const html = getPasswordResetEmailHTML({
    name,
    email: to,
    resetUrl,
    appName: 'Design Career Metrics aka DCM',
    year: new Date().getFullYear(),
    expiresIn: '1 hour'
  });
  await sendEmail({ to, subject, html });
};