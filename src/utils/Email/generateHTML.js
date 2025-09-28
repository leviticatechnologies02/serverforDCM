export const getVerificationEmailHTML = (name, verifyUrl, email) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
      <!-- Header -->
      <div style="background-color: #1e293b; padding: 20px; text-align: center;">
        <img src="https://yourdomain.com/logo.png" alt="Design Career Metric" style="height: 40px;" />
        <h1 style="color: #ffffff; font-size: 20px; margin-top: 10px;">Design Career Metric</h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px;">
        <h2 style="color: #222;">Hi ${name},</h2>
        <p style="color: #555; font-size: 16px;">
          Thanks for signing up! Click the button below to verify your email and activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Verify Email
          </a>
        </div>
        <p style="font-size: 13px; color: #888;">
          If you didn’t request this, you can safely ignore it.<br/>
          This email was sent to <strong>${email}</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Design Career Metric. All rights reserved.<br/>
        <a href="https://yourdomain.com/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> |
        <a href="https://yourdomain.com/contact" style="color: #2563eb; text-decoration: none;">Contact Us</a>
      </div>
    </div>
  `;
};
export const getPasswordResetEmailHTML = ({
  name,
  email,
  resetUrl,
  appName,
  year,
  expiresIn
}) => {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify to Reset Password</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5; padding:20px; text-align:center; color:#ffffff; font-size:24px; font-weight:bold;">
              Verify to Reset Your Password
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
              <p>Hi <strong>${name}</strong>,</p>
              <p>We received a request to reset the password for your account:</p>
              <p style="background-color:#f9f9f9; padding:10px; border-radius:4px; font-family:monospace; font-size:14px;">
                ${email}
              </p>
              <p>Before you can reset your password, please verify this request by clicking the button below.</p>
              <p>This link will expire in <strong>${expiresIn}</strong> for security reasons.</p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:30px auto;">
                <tr>
                  <td align="center" bgcolor="#4f46e5" style="border-radius:5px;">
                    <a href="${resetUrl}" target="_blank" 
                       style="display:inline-block; padding:12px 24px; font-size:16px; color:#ffffff; text-decoration:none; font-weight:bold;">
                      Verify & Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p>If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
              <p>Thanks,<br>The ${appName} Team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f4f4; padding:15px; text-align:center; font-size:12px; color:#888888;">
              &copy; ${year} ${appName}. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const getBatchAssignmentEmailHTML = (name, courseTitle, batchName,email) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
      <!-- Header -->
      <div style="background-color: #1e293b; padding: 20px; text-align: center;">
        <img src="https://yourdomain.com/logo.png" alt="Design Career Metric" style="height: 40px;" />
        <h1 style="color: #ffffff; font-size: 20px; margin-top: 10px;">Design Career Metric</h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px;">
        <h2 style="color: #222;">Hi ${name},</h2>
        <p style="color: #555; font-size: 16px;">
          Great news! You’ve been successfully assigned to a batch for your course <strong>${courseTitle}</strong>.
        </p>

        <div style="margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
          <p style="margin: 8px 0; font-size: 15px; color: #333;">
            <strong>Batch:</strong> ${batchName}
          </p>
         
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://yourdomain.com/dashboard" 
             style="background-color: #2563eb; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Go to Dashboard
          </a>
        </div>

        <p style="font-size: 13px; color: #888;">
          You can view your course schedule and resources in your dashboard.<br/>
          This email was sent to <strong>${email}</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Design Career Metric. All rights reserved.<br/>
        <a href="https://yourdomain.com/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> |
        <a href="https://yourdomain.com/contact" style="color: #2563eb; text-decoration: none;">Contact Us</a>
      </div>
    </div>
  `;
};