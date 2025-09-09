export const getVerificationEmailHTML = (name, token,email) => {
   const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${email}`;
  return `
    <div style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; border-radius: 10px;">
      <h2 style="color: #333;">Hi ${name},</h2>
      <p style="color: #555;">Thanks for signing up! Click the button below to verify your email:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Verify Email
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">If you didn’t request this, you can safely ignore it.</p>
    </div>
  `;
};