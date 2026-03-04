export const getVerificationEmailHTML = (name, verifyUrl, email) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
      <!-- Header -->
      <div style="background-color: #1e293b; padding: 20px; text-align: center;">
        <img src="https://api.designcareermetrics.com/img/dcmlogotransperent.png" alt="Design Career Metric" style="height: 40px;" />
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
        <a href="https://designcareermetrics.com/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> |
        <a href="https://designcareermetrics.com/contact-us" style="color: #2563eb; text-decoration: none;">Contact Us</a>
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
        <img src="https://api.designcareermetrics.com/img/dcmlogotransperent.png" alt="Design Career Metric" style="height: 40px;" />
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
        <a href="https://designcareermetrics.com/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> |
        <a href="https://designcareermetrics.com/contact-us" style="color: #2563eb; text-decoration: none;">Contact Us</a>
      </div>
    </div>
  `;
};

export const getContactEmailHTML = (name, email, message,mobile) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
      <!-- Header -->
      <div style="background-color: #1e293b; padding: 20px; text-align: center;">
        <img src="https://api.designcareermetrics.com/img/dcmlogotransperent.png" alt="Design Career Metric" style="height: 40px;" />
        <h1 style="color: #ffffff; font-size: 20px; margin-top: 10px;">Design Career Metric</h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px;">
        <h2 style="color: #222;">New Contact Form Submission</h2>
        <p style="color: #555; font-size: 16px;">
          You’ve received a new message via the website contact form.
        </p>
        <div style="margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mobile Number:</strong> ${mobile}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        </div>
        <p style="font-size: 13px; color: #888;">
          You can reply directly to <strong>${email}</strong> to continue the conversation.
        </p>
        
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Design Career Metric. All rights reserved.<br/>
        <a href="https://designcareermetrics.com/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> |
        <a href="https://designcareermetrics.com/contact-us" style="color: #2563eb; text-decoration: none;">Contact Us</a>
      </div>
    </div>
  `;
};

export const getInternshipPaymentSuccessEmailHTML = (name, email, programDetails, paymentDetails) => {
  const { domain, program, duration, amount } = programDetails;
  const { paymentId, orderId, date } = paymentDetails;

  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
        <img src="https://api.designcareermetrics.com/img/dcmlogotransperent.png" alt="Design Career Metrics" style="height: 50px;" />
        <h1 style="color: #ffffff; font-size: 24px; margin-top: 15px; font-weight: 700;">Payment Successful!</h1>
        <p style="color: #d1fae5; font-size: 16px; margin-top: 8px;">Internship Program Registration Confirmed</p>
      </div>

      <!-- Body -->
      <div style="padding: 40px; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px;">
        <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">Hi ${name},</h2>
        
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          Thank you for your payment! Your registration for the internship program has been successfully confirmed. 
          We're excited to have you onboard for this learning journey.
        </p>

        <!-- Program Details Card -->
        <div style="margin: 25px 0; padding: 25px; border: 2px solid #d1fae5; border-radius: 8px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);">
          <h3 style="color: #065f46; font-size: 18px; margin-bottom: 15px; font-weight: 600;">🎯 Program Details</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;">
                <strong style="color: #065f46;">Internship Domain:</strong><br/>
                <span style="color: #059669; font-weight: 600;">${getDomainDisplayName(domain)}</span>
              </p>
            </div>
            <div>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;">
                <strong style="color: #065f46;">Program:</strong><br/>
                <span style="color: #059669; font-weight: 600;">${getProgramDisplayName(program)}</span>
              </p>
            </div>
            <div>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;">
                <strong style="color: #065f46;">Duration:</strong><br/>
                <span style="color: #059669; font-weight: 600;">${duration}</span>
              </p>
            </div>
            <div>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;">
                <strong style="color: #065f46;">Amount Paid:</strong><br/>
                <span style="color: #059669; font-weight: 600;">₹${amount}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div style="margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f8fafc;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 15px; font-weight: 600;">💰 Payment Information</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="margin: 6px 0; font-size: 13px; color: #6b7280;">
                <strong>Payment ID:</strong><br/>
                <span style="color: #374151; font-family: monospace;">${paymentId}</span>
              </p>
            </div>
            <div>
              <p style="margin: 6px 0; font-size: 13px; color: #6b7280;">
                <strong>Order ID:</strong><br/>
                <span style="color: #374151; font-family: monospace;">${orderId}</span>
              </p>
            </div>
            <div>
              <p style="margin: 6px 0; font-size: 13px; color: #6b7280;">
                <strong>Payment Date:</strong><br/>
                <span style="color: #374151;">${date}</span>
              </p>
            </div>
            <div>
              <p style="margin: 6px 0; font-size: 13px; color: #6b7280;">
                <strong>Status:</strong><br/>
                <span style="color: #059669; font-weight: 600;">✅ Paid</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div style="margin: 25px 0; padding: 20px; border-left: 4px solid #3b82f6; background-color: #eff6ff;">
          <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 12px; font-weight: 600;">📋 What's Next?</h3>
          <ul style="color: #374151; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0;">
            <li>Prepare your development environment as per requirements</li>

          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://designcareermetrics.com" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Visit Design Career Metrics
          </a>
        </div>

        <!-- Support Info -->
        <div style="margin-top: 25px; padding: 15px; background-color: #fef3c7; border-radius: 6px; border: 1px solid #f59e0b;">
          <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
            <strong>Need Help?</strong> Contact our support team at 
            <a href="mailto:support@designcareermetrics.com" style="color: #dc2626; text-decoration: none;">support@designcareermetrics.com</a>
          </p>
        </div>

        <p style="font-size: 13px; color: #9ca3af; margin-top: 25px;">
          This email was sent to <strong>${email}</strong>. Please do not reply to this automated message.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #1e293b; padding: 25px; text-align: center; font-size: 12px; color: #cbd5e1;">
        <p style="margin: 0 0 10px 0;">
          &copy; ${new Date().getFullYear()} Design Career Metrics. All rights reserved.
        </p>
        <p style="margin: 8px 0;">
          <a href="https://designcareermetrics.com/privacy" style="color: #60a5fa; text-decoration: none; margin: 0 10px;">Privacy Policy</a> |
          <a href="https://designcareermetrics.com/terms" style="color: #60a5fa; text-decoration: none; margin: 0 10px;">Terms of Service</a> |
          <a href="https://designcareermetrics.com/contact-us" style="color: #60a5fa; text-decoration: none; margin: 0 10px;">Contact Us</a>
        </p>
        <p style="margin: 8px 0; color: #94a3b8;">
          Design Career Metrics<br/>
          Empowering students with industry-relevant skills
        </p>
      </div>
    </div>
  `;
};

// Helper functions for display names
const getDomainDisplayName = (domainId) => {
  const domains = {
    'java-fullstack': 'Java Full Stack Development',
    'python-ai': 'Python Full Stack + Generative AI',
    'dotnet-cloud': '.NET Full Stack + Cloud AI',
    'flutter-mobile': 'Flutter Mobile App Development',
    'software-testing': 'Software Testing & Automation',
    'data-science-ai': 'Data Science & AI'
  };
  return domains[domainId] || domainId;
};

 export const getProgramDisplayName = (programId) => {
  const programs = {
    '5days': '5 Days Intensive Program',
    '15days': '15 Days Comprehensive Program'
  };
  return programs[programId] || programId;
};

export const getVerificationEmailHTMLOTP = (name, otp, email) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
      <!-- Header -->
      <div style="background-color: #1e293b; padding: 20px; text-align: center;">
        <img src="https://api.designcareermetrics.com/img/dcmlogotransperent.png" alt="Design Career Metric" style="height: 40px;" />
        <h1 style="color: #ffffff; font-size: 20px; margin-top: 10px;">Design Career Metric</h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px;">
        <h2 style="color: #222;">Hi ${name},</h2>
        <p style="color: #555; font-size: 16px;">
          Thanks for signing up! Use the OTP below to verify your email and activate your account.
        </p>
        
        <!-- OTP Display -->
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 8px; display: inline-block;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">YOUR VERIFICATION CODE</div>
            <div style="font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 8px; font-family: monospace;">
              ${otp}
            </div>
          </div>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="color: #d97706; font-size: 18px;">⚠️</div>
            <div>
              <strong style="color: #92400e;">Important:</strong>
              <ul style="color: #92400e; margin: 8px 0; padding-left: 20px;">
                <li>This OTP is valid for <strong>10 minutes</strong> only</li>
                <li>Do not share this code with anyone</li>
                <li>Enter this code in the verification page to complete your registration</li>
              </ul>
            </div>
          </div>
        </div>

        <p style="font-size: 13px; color: #888;">
          If you didn't request this, you can safely ignore it.<br/>
          This email was sent to <strong>${email}</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Design Career Metric. All rights reserved.<br/>
        <a href="https://designcareermetrics.com/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> |
        <a href="https://designcareermetrics.com/contact-us" style="color: #2563eb; text-decoration: none;">Contact Us</a>
      </div>
    </div>
  `;
};

export const getLiveClassScheduledEmailHTML = (
  name,
  title,
  startTime,
  duration,
  joinUrl,
  email
) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
      
      <!-- Header -->
      <div style="background-color: #1e293b; padding: 20px; text-align: center;">
        <img src="https://api.designcareermetrics.com/img/dcmlogotransperent.png" alt="Design Career Metric" style="height: 40px;" />
        <h1 style="color: #ffffff; font-size: 20px; margin-top: 10px;">Design Career Metric</h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px;">
        <h2 style="color: #222;">Hi ${name},</h2>

        <p style="color: #555; font-size: 16px;">
          A new <strong>Live Class</strong> has been scheduled for your course.
        </p>

        <div style="margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
          
          <p style="margin: 8px 0; font-size: 15px; color: #333;">
            <strong>Class Title:</strong> ${title}
          </p>

          <p style="margin: 8px 0; font-size: 15px; color: #333;">
            <strong>Start Time:</strong> ${startTime}
          </p>

          <p style="margin: 8px 0; font-size: 15px; color: #333;">
            <strong>Duration:</strong> ${duration} minutes
          </p>

        </div>

        <!-- Join Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${joinUrl}" 
             style="background-color: #2563eb; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Join Live Class
          </a>
        </div>

        <p style="font-size: 13px; color: #888;">
          Please join the session on time to get the most out of the class.<br/>
          This email was sent to <strong>${email}</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Design Career Metric. All rights reserved.<br/>
        <a href="https://designcareermetrics.com/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> |
        <a href="https://designcareermetrics.com/contact-us" style="color: #2563eb; text-decoration: none;">Contact Us</a>
      </div>

    </div>
  `;
};