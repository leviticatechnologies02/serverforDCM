export const getVerificationEmailHTML = (name, verifyUrl, email) => {
  return `
    <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
          <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
          <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            Levitica Technologies Pvt Ltd
          </h1>
          <p style="font-size:13px; color:#6c86a3; margin-top:6px;">Secure Platform</p>
        </div>
        <div style="background:linear-gradient(98deg, #4f46e5 0%, #6366f1 100%); padding:18px 24px; text-align:center;">
          <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">📧 Verify Your Email Address</span>
        </div>
        <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
          <p style="margin-top:0; margin-bottom:18px; font-size:16px;">Hi <strong style="color:#1e3a8a;">${name}</strong>,</p>
          <p style="margin-bottom:16px;">Thanks for signing up! Click the button below to verify your email and activate your account.</p>
          
          ${password ? `
          <div style="background:#fef3c7; border-radius:16px; padding:20px; margin:20px 0; border-left:4px solid #f59e0b;">
            <h3 style="color:#b45309; font-size:16px; margin-bottom:15px;">🔑 Your Login Credentials</h3>
            <p style="margin:6px 0;">We have automatically created an account for you!</p>
            <p style="margin:6px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin:6px 0;"><strong>Password:</strong> ${password}</p>
            <p style="margin:6px 0; font-size:13px; color:#92400e;">Please login and change your password immediately.</p>
          </div>` : ''}
  
          <div style="text-align:center; margin:30px 0;">
            <a href="${verifyUrl}" style="background:#4f46e5; color:#ffffff; padding:14px 32px; border-radius:44px; text-decoration:none; font-weight:600; display:inline-block; box-shadow:0 6px 14px rgba(79,70,229,0.25);">Verify Email</a>
          </div>
          <div style="background:#fef9f0; border-radius:16px; padding:12px 20px; margin:20px 0; border:1px solid #ffedd5;">
            <p style="margin:0; font-size:13.5px; color:#92400e;">🔒 This link expires in 24 hours. If you didn't request this, please ignore this email.</p>
          </div>
          <p style="font-size:13px; color:#6c757d; margin-top:20px;">This email was sent to <strong>${email}</strong></p>
          <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Thanks,<br /><strong>The Levitica Team</strong></p>
        </div>
        <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #eef2f6;">
          <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Levitica Technologies Pvt Ltd. All rights reserved.</p>
          <p style="margin:0;"><a href="https://leviticatechnologies.com/privacy" style="color:#6c86a3; text-decoration:none;">Privacy Policy</a> | <a href="https://leviticatechnologies.com/contact-us" style="color:#6c86a3; text-decoration:none;">Contact Us</a></p>
        </div>
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
    <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
          <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
          <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            Levitica Technologies Pvt Ltd
          </h1>
          <p style="font-size:13px; color:#6c86a3; margin-top:6px;">Enterprise Security</p>
        </div>
        <div style="background:linear-gradient(98deg, #4f46e5 0%, #6366f1 100%); padding:18px 24px; text-align:center;">
          <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">🔐 Verify to Reset Your Password</span>
        </div>
        <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
          <p style="margin-top:0; margin-bottom:18px; font-size:16px;">Hi <strong style="color:#1e3a8a;">${name}</strong>,</p>
          <p style="margin-bottom:16px;">We received a request to reset the password associated with your Levitica account. To keep your account secure, please use the verification below.</p>
          <div style="background:#f8fafc; border-left:4px solid #4f46e5; padding:12px 18px; border-radius:14px; margin:20px 0;">
            <span style="font-weight:600; color:#334155;">📧 Account:</span> <span style="font-family:monospace; letter-spacing:0.3px;">${email}</span>
          </div>
          <div style="background:#fff7e5; border-radius:16px; padding:8px 16px; display:inline-block; margin:8px 0 10px 0;">
            <span style="font-size:13px; font-weight:500; color:#b45309;">⏱️ Link expires in <strong>${expiresIn}</strong></span>
          </div>
          <div style="text-align:center; margin:32px 0 28px 0;">
            <a href="${resetUrl}" style="background:#4f46e5; color:#ffffff; padding:14px 32px; border-radius:44px; text-decoration:none; font-weight:600; display:inline-block; box-shadow:0 6px 14px rgba(79,70,229,0.25);">✓ Verify & Reset Password</a>
          </div>
          <div style="background:#fef9f0; border-radius:16px; padding:12px 20px; margin:20px 0; border:1px solid #ffedd5;">
            <p style="margin:0; font-size:13.5px; color:#92400e;">🛡️ If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
          </div>
          <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Thanks,<br /><strong>The ${appName} Team</strong></p>
          <div style="margin-top:12px;"><span style="font-size:12px; color:#94a3b8;">🔒 Secure & encrypted request</span></div>
        </div>
        <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12.5px; color:#6c757d; border-top:1px solid #eef2f6;">
          <p style="margin:0 0 6px 0;">© ${year} ${appName}. All rights reserved.</p>
          <p style="margin:0; font-size:12px;">Levitica Technologies Pvt Ltd — Innovating enterprise solutions</p>
          <div style="margin-top:12px;"><a href="#" style="color:#6c86a3; text-decoration:none; margin:0 8px;">Privacy Policy</a> <span style="color:#d1d9e8;">|</span> <a href="#" style="color:#6c86a3; text-decoration:none; margin:0 8px;">Support Center</a></div>
        </div>
      </div>
      <div style="text-align:center; font-size:11px; color:#9aaebf; margin-top:24px; padding:0 16px;">This is an automated transactional message from Levitica Technologies. If you received this by mistake, no further action is required.</div>
    </div>
  `;
};

export const getBatchAssignmentEmailHTML = (name, courseTitle, batchName, email) => {
  return `
    <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
          <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
          <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            Levitica Technologies Pvt Ltd
          </h1>
          <p style="font-size:13px; color:#6c86a3; margin-top:6px;">Learning Management System</p>
        </div>
        <div style="background:linear-gradient(98deg, #4f46e5 0%, #6366f1 100%); padding:18px 24px; text-align:center;">
          <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">🎓 Batch Assignment Confirmed</span>
        </div>
        <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
          <p style="margin-top:0; margin-bottom:18px; font-size:16px;">Hi <strong style="color:#1e3a8a;">${name}</strong>,</p>
          <p style="margin-bottom:16px;">Great news! You've been successfully assigned to a batch for your course <strong>${courseTitle}</strong>.</p>
          <div style="background:#f8fafc; border-left:4px solid #4f46e5; padding:12px 18px; border-radius:14px; margin:20px 0;">
            <p style="margin:8px 0; font-size:15px;"><strong>📚 Batch Name:</strong> ${batchName}</p>
          </div>
          <div style="text-align:center; margin:30px 0;">
            <a href="https://leviticatechnologies.com/dashboard" style="background:#4f46e5; color:#ffffff; padding:14px 32px; border-radius:44px; text-decoration:none; font-weight:600; display:inline-block; box-shadow:0 6px 14px rgba(79,70,229,0.25);">Go to Dashboard</a>
          </div>
          <p style="margin-bottom:16px;">You can view your course schedule and resources in your dashboard.</p>
          <p style="font-size:13px; color:#6c757d;">This email was sent to <strong>${email}</strong></p>
          <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Thanks,<br /><strong>The Levitica Team</strong></p>
        </div>
        <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #eef2f6;">
          <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Levitica Technologies Pvt Ltd. All rights reserved.</p>
          <p style="margin:0;"><a href="https://leviticatechnologies.com/privacy" style="color:#6c86a3; text-decoration:none;">Privacy Policy</a> | <a href="https://leviticatechnologies.com/contact-us" style="color:#6c86a3; text-decoration:none;">Contact Us</a></p>
        </div>
      </div>
    </div>
  `;
};

  export const getContactEmailHTML = (name, email, message, mobile) => {
    return `
      <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
          <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
            <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
            <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
              Levitica Technologies Pvt Ltd
            </h1>
          </div>
          <div style="background:linear-gradient(98deg, #4f46e5 0%, #6366f1 100%); padding:18px 24px; text-align:center;">
            <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">📬 New Contact Form Submission</span>
          </div>
          <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
            <h2 style="color:#1f2937; font-size:20px; margin-bottom:20px;">New message from ${name}</h2>
            <div style="background:#f8fafc; border-radius:16px; padding:20px; margin:20px 0; border-left:4px solid #4f46e5;">
              <p style="margin:8px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin:8px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin:8px 0;"><strong>Mobile Number:</strong> ${mobile}</p>
              <p style="margin:8px 0;"><strong>Message:</strong><br/>${message}</p>
            </div>
            <p style="margin-top:20px;">You can reply directly to <strong>${email}</strong> to continue the conversation.</p>
            <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Best regards,<br /><strong>Levitica Support Team</strong></p>
          </div>
          <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #eef2f6;">
            <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Levitica Technologies Pvt Ltd. All rights reserved.</p>
            <p style="margin:0;"><a href="https://leviticatechnologies.com/privacy" style="color:#6c86a3; text-decoration:none;">Privacy Policy</a> | <a href="https://leviticatechnologies.com/contact-us" style="color:#6c86a3; text-decoration:none;">Contact Us</a></p>
          </div>
        </div>
      </div>
    `;
  };

// Helper functions for internship payment
 export const getDomainDisplayName = (domainId) => {
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

export const getInternshipPaymentSuccessEmailHTML = (name, email, programDetails, paymentDetails, password = null) => {
  const { domain, program, duration, amount } = programDetails;
  const { paymentId, orderId, date } = paymentDetails;

  return `
    <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
          <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
          <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            Levitica Technologies Pvt Ltd
          </h1>
          <p style="font-size:13px; color:#6c86a3; margin-top:6px;">Internship Program</p>
        </div>
        <div style="background:linear-gradient(98deg, #10b981 0%, #059669 100%); padding:18px 24px; text-align:center;">
          <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">✅ Payment Successful – Internship Confirmed</span>
        </div>
        <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
          <p style="margin-top:0; margin-bottom:18px; font-size:16px;">Hi <strong style="color:#1e3a8a;">${name}</strong>,</p>
          <p style="margin-bottom:16px;">Thank you for your payment! Your registration for the internship program has been successfully confirmed. We're excited to have you onboard for this learning journey.</p>
          
          <div style="background:#f0fdf4; border-radius:16px; padding:20px; margin:20px 0; border:1px solid #d1fae5;">
            <h3 style="color:#065f46; font-size:18px; margin-bottom:15px;">🎯 Program Details</h3>
            <p style="margin:8px 0;"><strong style="color:#065f46;">Internship Domain:</strong> ${getDomainDisplayName(domain)}</p>
            <p style="margin:8px 0;"><strong style="color:#065f46;">Program:</strong> ${getProgramDisplayName(program)}</p>
            <p style="margin:8px 0;"><strong style="color:#065f46;">Duration:</strong> ${duration}</p>
            <p style="margin:8px 0;"><strong style="color:#065f46;">Amount Paid:</strong> ₹${amount}</p>
          </div>
          
          <div style="background:#f8fafc; border-radius:16px; padding:20px; margin:20px 0; border-left:4px solid #4f46e5;">
            <h3 style="color:#374151; font-size:16px; margin-bottom:15px;">💰 Payment Information</h3>
            <p style="margin:6px 0;"><strong>Payment ID:</strong> ${paymentId}</p>
            <p style="margin:6px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin:6px 0;"><strong>Payment Date:</strong> ${date}</p>
            <p style="margin:6px 0;"><strong>Status:</strong> ✅ Paid</p>
          </div>
          
          <div style="background:#eff6ff; border-radius:16px; padding:20px; margin:20px 0; border-left:4px solid #3b82f6;">
            <h3 style="color:#1e40af; font-size:16px; margin-bottom:12px;">📋 What's Next?</h3>
            <ul style="margin:0; padding-left:20px;">
              <li>Prepare your development environment as per requirements</li>
              <li>You will receive orientation details within 24 hours</li>
              <li>Check your dashboard for project guidelines</li>
            </ul>
          </div>
          
          <div style="text-align:center; margin:30px 0;">
            <a href="https://leviticatechnologies.com" style="background:#10b981; color:#ffffff; padding:14px 32px; border-radius:44px; text-decoration:none; font-weight:600; display:inline-block;">Visit Levitica Technologies</a>
          </div>
          
          <div style="background:#fef3c7; border-radius:16px; padding:15px; margin:20px 0; border:1px solid #f59e0b;">
            <p style="margin:0; color:#92400e; text-align:center;"><strong>Need Help?</strong> Contact our support team at <a href="mailto:info@leviticatechnologies.com" style="color:#dc2626; text-decoration:none;">info@leviticatechnologies.com</a></p>
          </div>
          
          <p style="font-size:13px; color:#9ca3af; margin-top:25px;">This email was sent to <strong>${email}</strong>. Please do not reply to this automated message.</p>
          <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Thanks,<br /><strong>The Levitica Team</strong></p>
        </div>
        <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #eef2f6;">
          <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Levitica Technologies Pvt Ltd. All rights reserved.</p>
          <p style="margin:0;">Levitica Technologies — Empowering students with industry-relevant skills</p>
        </div>
      </div>
    </div>
  `;
};

export const getCoursePaymentSuccessEmailHTML = (name, email, courseDetails, paymentDetails) => {
  const { courses, amount } = courseDetails;
  const { paymentId, orderId, date } = paymentDetails;

  const courseList = courses.map(course => `<li style="margin:6px 0;"><strong style="color:#059669;">${course}</strong></li>`).join("");

  return `
    <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
          <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
          <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            Levitica Technologies Pvt Ltd
          </h1>
          <p style="font-size:13px; color:#6c86a3; margin-top:6px;">Course Enrollment</p>
        </div>
        <div style="background:linear-gradient(98deg, #6366f1 0%, #4f46e5 100%); padding:18px 24px; text-align:center;">
          <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">📚 Payment Successful – Course Enrollment Confirmed</span>
        </div>
        <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
          <p style="margin-top:0; margin-bottom:18px; font-size:16px;">Hi <strong style="color:#1e3a8a;">${name}</strong>,</p>
          <p style="margin-bottom:16px;">Thank you for your payment! Your course enrollment has been successfully confirmed. You now have access to the course content and resources.</p>
          
          <div style="background:#eef2ff; border-radius:16px; padding:20px; margin:20px 0; border:1px solid #e0e7ff;">
            <h3 style="color:#4338ca; font-size:18px; margin-bottom:15px;">📚 Enrolled Courses</h3>
            <ul style="margin:0; padding-left:20px;">${courseList}</ul>
            <p style="margin-top:15px;"><strong>Total Amount Paid:</strong> <span style="color:#059669; font-weight:600;">₹${amount}</span></p>
          </div>
          
          <div style="background:#f8fafc; border-radius:16px; padding:20px; margin:20px 0; border-left:4px solid #4f46e5;">
            <h3 style="color:#374151; font-size:16px; margin-bottom:15px;">💰 Payment Information</h3>
            <p style="margin:6px 0;"><strong>Payment ID:</strong> ${paymentId}</p>
            <p style="margin:6px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin:6px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin:6px 0;"><strong>Status:</strong> ✅ Paid</p>
          </div>
          
          <div style="background:#eff6ff; border-radius:16px; padding:20px; margin:20px 0; border-left:4px solid #3b82f6;">
            <h3 style="color:#1e40af; margin-bottom:10px;">📋 What's Next?</h3>
            <ul style="margin:0; padding-left:20px;">
              <li>Login to your account</li>
              <li>Access the enrolled course materials</li>
              <li>Start learning and complete lessons</li>
            </ul>
          </div>
          
          <div style="text-align:center; margin:30px 0;">
            <a href="https://leviticatechnologies.com/dashboard" style="background:#4f46e5; color:#ffffff; padding:14px 32px; border-radius:44px; text-decoration:none; font-weight:600; display:inline-block;">Go to My Courses</a>
          </div>
          
          <div style="background:#fef3c7; border-radius:16px; padding:15px; margin:20px 0; border:1px solid #f59e0b;">
            <p style="margin:0; color:#92400e; text-align:center;"><strong>Need Help?</strong> Contact us at <a href="mailto:info@leviticatechnologies.com" style="color:#dc2626; text-decoration:none;">info@leviticatechnologies.com</a></p>
          </div>
          
          <p style="font-size:13px; color:#9ca3af; margin-top:25px;">This email was sent to <strong>${email}</strong>.</p>
          <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Thanks,<br /><strong>The Levitica Team</strong></p>
        </div>
        <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #eef2f6;">
          <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Levitica Technologies Pvt Ltd. All rights reserved.</p>
          <p style="margin:0;">Levitica Technologies — Empowering students with industry-relevant skills</p>
        </div>
      </div>
    </div>
  `;
};

export const getVerificationEmailHTMLOTP = (name, otp, email) => {
  return `
    <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
          <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
          <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            Levitica Technologies Pvt Ltd
          </h1>
          <p style="font-size:13px; color:#6c86a3; margin-top:6px;">Secure Verification</p>
        </div>
        <div style="background:linear-gradient(98deg, #4f46e5 0%, #6366f1 100%); padding:18px 24px; text-align:center;">
          <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">🔑 Email Verification OTP</span>
        </div>
        <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
          <p style="margin-top:0; margin-bottom:18px; font-size:16px;">Hi <strong style="color:#1e3a8a;">${name}</strong>,</p>
          <p style="margin-bottom:16px;">Thanks for signing up! Use the OTP below to verify your email and activate your account.</p>
          
          <div style="background:#f1f5f9; text-align:center; padding:24px; margin:24px 0; border-radius:16px;">
            <div style="font-size:36px; font-weight:bold; letter-spacing:8px; font-family:monospace; color:#1e293b;">${otp}</div>
            <p style="margin:12px 0 0; font-size:12px; color:#64748b;">Valid for 10 minutes</p>
          </div>
          
          <div style="background:#fef9f0; border-radius:16px; padding:12px 20px; margin:20px 0; border:1px solid #ffedd5;">
            <p style="margin:0; font-size:13.5px; color:#92400e;">⚠️ Do not share this OTP with anyone. This code is for your verification only.</p>
          </div>
          
          <p style="font-size:13px; color:#6c757d;">This email was sent to <strong>${email}</strong></p>
          <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Thanks,<br /><strong>The Levitica Team</strong></p>
        </div>
        <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #eef2f6;">
          <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Levitica Technologies Pvt Ltd. All rights reserved.</p>
          <p style="margin:0;"><a href="https://leviticatechnologies.com/privacy" style="color:#6c86a3; text-decoration:none;">Privacy Policy</a> | <a href="https://leviticatechnologies.com/contact-us" style="color:#6c86a3; text-decoration:none;">Contact Us</a></p>
        </div>
      </div>
    </div>
  `;
};

export const getLiveClassScheduledEmailHTML = (name, title, startTime, duration, joinUrl, email) => {
  return `
    <div style="max-width:580px; margin:0 auto; background:#f0f2f5; padding:20px 0 40px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="padding:24px 28px 12px; text-align:center; border-bottom:1px solid #f0f0f0;">
          <img src="https://leviticatechnologies.com/img/leviticalogo.png" alt="Levitica Technologies" style="height:52px; width:auto; margin-bottom:8px;" />
          <h1 style="font-size:24px; margin:12px 0 4px; font-weight:700; background:linear-gradient(135deg, #166c8c 0%, #3b36db 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            Levitica Technologies Pvt Ltd
          </h1>
          <p style="font-size:13px; color:#6c86a3; margin-top:6px;">Live Learning</p>
        </div>
        <div style="background:linear-gradient(98deg, #4f46e5 0%, #6366f1 100%); padding:18px 24px; text-align:center;">
          <span style="background:rgba(255,255,255,0.12); padding:6px 18px; border-radius:60px; color:#fff; font-weight:600; font-size:15px;">🎥 Live Class Scheduled</span>
        </div>
        <div style="padding:32px 32px 28px; color:#1f2937; font-size:15px; line-height:1.55;">
          <p style="margin-top:0; margin-bottom:18px; font-size:16px;">Hi <strong style="color:#1e3a8a;">${name}</strong>,</p>
          <p style="margin-bottom:16px;">A new <strong>Live Class</strong> has been scheduled for your course.</p>
          
          <div style="background:#f8fafc; border-left:4px solid #4f46e5; padding:20px; border-radius:14px; margin:20px 0;">
            <p style="margin:8px 0;"><strong>Class Title:</strong> ${title}</p>
            <p style="margin:8px 0;"><strong>Start Time:</strong> ${startTime}</p>
            <p style="margin:8px 0;"><strong>Duration:</strong> ${duration} minutes</p>
          </div>
          
          <div style="text-align:center; margin:30px 0;">
            <a href="${joinUrl}" style="background:#4f46e5; color:#ffffff; padding:14px 32px; border-radius:44px; text-decoration:none; font-weight:600; display:inline-block; box-shadow:0 6px 14px rgba(79,70,229,0.25);">Join Live Class</a>
          </div>
          
          <div style="background:#eff6ff; border-radius:16px; padding:12px 20px; margin:20px 0;">
            <p style="margin:0; font-size:13.5px; color:#1e40af;">💡 Please join the session on time to get the most out of the class. Make sure your microphone and camera are ready.</p>
          </div>
          
          <p style="font-size:13px; color:#6c757d;">This email was sent to <strong>${email}</strong></p>
          <p style="margin-top:24px; border-top:1px solid #edf2f7; padding-top:20px;">Thanks,<br /><strong>The Levitica Team</strong></p>
        </div>
        <div style="background:#f9fafb; padding:20px 24px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #eef2f6;">
          <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Levitica Technologies Pvt Ltd. All rights reserved.</p>
          <p style="margin:0;"><a href="https://leviticatechnologies.com/privacy" style="color:#6c86a3; text-decoration:none;">Privacy Policy</a> | <a href="https://leviticatechnologies.com/contact-us" style="color:#6c86a3; text-decoration:none;">Contact Us</a></p>
        </div>
      </div>
    </div>
  `;
};