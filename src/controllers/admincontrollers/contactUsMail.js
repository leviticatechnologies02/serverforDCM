import {
  getContactEmailHTML,
  getEnquiryAutoReplyHTML,
  getProductEnquiryAdminEmailHTML
} from "../../utils/Email/generateHTML.js";
import { sendEmail } from "../../utils/Email/sendEmail.js";
import Enquiry from "../../models/Enquiry.js";

const PRODUCT_SLUG_MAP = {
  "hrms": "HRMS",
  "hostel-pg-system": "Hostel & PG System",
  "ai-hr-crm": "Levitica One",
  "dvskillhub": "DVSkillHub",
  "hospital-system": "Hospital System",
  "levitica-connect": "Levitica Connect",
  "levitica-core": "Levitica Core",
  "levitica-academy": "Levitica Academy"
};

export const submitContactForm = async (req, res) => {
  const { name, email, message, mobile, details } = req.body;

  const detailsObj = (typeof details === "object" && details !== null) ? { ...details } : {};

  // Resolve email address
  const userEmail = (email || detailsObj.email || req.body.mail || "").trim();
  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  // Resolve Organization / Institution Name from all product schemas
  const organizationName = (
    detailsObj.companyName ||
    req.body.companyName ||
    detailsObj.propertyName ||
    req.body.propertyName ||
    detailsObj.collegeName ||
    req.body.collegeName ||
    detailsObj.facilityName ||
    req.body.facilityName ||
    ""
  ).trim();

  // Resolve Contact Person Name from all product schemas
  const contactPerson = (
    detailsObj.contactName ||
    req.body.contactName ||
    detailsObj.hrManager ||
    req.body.hrManager ||
    detailsObj.ownerName ||
    req.body.ownerName ||
    detailsObj.tpoName ||
    req.body.tpoName ||
    detailsObj.adminName ||
    req.body.adminName ||
    name ||
    detailsObj.name ||
    organizationName ||
    "Prospective Client"
  ).trim();

  // Resolve Mobile Number
  const contactMobile = (
    mobile ||
    req.body.phone ||
    detailsObj.mobile ||
    detailsObj.phone ||
    "N/A"
  ).toString().trim();

  // Resolve Product Title & Slug
  const productSlug = (detailsObj.productSlug || req.body.productSlug || req.body.slug || "").trim();
  const rawProductTitle = (
    detailsObj.productTitle ||
    req.body.productTitle ||
    detailsObj.productName ||
    req.body.productName ||
    (productSlug ? PRODUCT_SLUG_MAP[productSlug] : "") ||
    ""
  ).trim();

  // Resolve Message (safe fallback if user leaves optional message field empty)
  const userMessage = (
    message ||
    detailsObj.message ||
    (rawProductTitle
      ? `Enquiry for ${rawProductTitle}${organizationName ? ` from ${organizationName}` : ''}`
      : "Contact inquiry submitted.")
  ).trim();

  // Resolve other common product enquiry fields
  const designation = (detailsObj.designation || req.body.designation || "").trim();
  const food = (detailsObj.food || req.body.food || "").trim();
  const state = (detailsObj.state || req.body.state || "").trim();
  const city = (detailsObj.city || req.body.city || "").trim();

  const isProductEnquiry = Boolean(rawProductTitle || Object.keys(detailsObj).length > 0);

  try {
    // 1. Save enquiry to database
    await Enquiry.create({
      name: contactPerson,
      email: userEmail,
      mobile: contactMobile,
      message: userMessage,
      details: {
        ...detailsObj,
        ...(rawProductTitle && { productTitle: rawProductTitle }),
        ...(productSlug && { productSlug }),
        ...(organizationName && { organizationName }),
        ...(contactPerson && { contactPerson }),
        ...(designation && { designation }),
        ...(food && { food }),
        ...(state && { state }),
        ...(city && { city })
      }
    });

    // 2. Send email to Admin (info@leviticatechnologies.com & backup to leviticatechnologies@gmail.com)
    const adminRecipients = ["info@leviticatechnologies.com", "leviticatechnologies@gmail.com"];

    const adminSubject = rawProductTitle
      ? `New Product Enquiry: ${rawProductTitle} from ${contactPerson}${organizationName ? ` (${organizationName})` : ''}`
      : `New Contact Form Submission from ${contactPerson}`;

    const adminHtml = isProductEnquiry
      ? getProductEnquiryAdminEmailHTML({
          productTitle: rawProductTitle,
          contactName: contactPerson,
          organizationName,
          email: userEmail,
          mobile: contactMobile,
          designation,
          food,
          state,
          city,
          message: userMessage,
          details: detailsObj
        })
      : getContactEmailHTML(contactPerson, userEmail, userMessage, contactMobile);

    await sendEmail({
      to: adminRecipients,
      html: adminHtml,
      replyTo: userEmail,
      subject: adminSubject
    });

    // 3. Send Auto-Reply to User
    const userSubject = rawProductTitle
      ? `Thank you for your interest in ${rawProductTitle}`
      : "Thank you for contacting Levitica Technologies";

    await sendEmail({
      to: userEmail,
      html: getEnquiryAutoReplyHTML(contactPerson, rawProductTitle || "our Products & Services"),
      subject: userSubject
    });

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Email send or DB error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};



