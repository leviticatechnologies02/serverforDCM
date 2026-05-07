import Mentor from '../../../models/mentor.js';
import ApiError from '../../../utils/ApiError.js';
import { getMentorWelcomeEmailHTML } from '../../../utils/email/generateHTML.js';
import { sendEmail } from '../../../utils/email/sendEmail.js';

export class MentorsService {
  static async createMentor({ name, email, mobile, expertise }) {
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      throw new ApiError(400, "Mentor already exists");
    }

    const newMentor = new Mentor({ name, email, mobile, expertise });
    await newMentor.save();

    const emailHTML = getMentorWelcomeEmailHTML(name, email);
    await sendEmail({
      to: email,
      subject: "Congratulations! You are now a Mentor",
      html: emailHTML,
    }).catch(() => {
      // Don't fail mentor creation if email dispatch fails
    });

    return newMentor;
  }

  static async getMentors(filters = {}) {
    const mentors = await Mentor.find(filters);
    return mentors;
  }

  static async updateMentor(id, updateData) {
    const mentor = await Mentor.findByIdAndUpdate(id, updateData, { new: true });
    if (!mentor) {
      throw new ApiError(404, "Mentor not found");
    }
    return mentor;
  }

  static async deleteMentor(id) {
    const mentor = await Mentor.findByIdAndDelete(id);
    if (!mentor) {
      throw new ApiError(404, "Mentor not found");
    }
    return { message: "Mentor deleted successfully" };
  }
}

export default MentorsService;
