import InternshipsDomain from "../../models/internshipsDomain.js";

/* ================= CREATE INTERNSHIP DOMAIN ================= */
export const createInternshipsDomain = async (req, res) => {
  console.log(req.body, "iam body from internships");

  try {
    const domain = await InternshipsDomain.create(req.body);

    res.status(201).json({
      success: true,
      message: "Internships domain created successfully",
      data: domain,
    });
  } catch (error) {
    console.error("CREATE DOMAIN ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL INTERNSHIP DOMAINS ================= */
export const getAllInternshipsDomains = async (req, res) => {
  try {
    const { all, isActive } = req.query;

    let filter = {};

    // Case 1: explicit isActive=true/false
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    // Case 2: admin wants all domains
    else if (all === "true") {
      filter = {};
    }
    // Default: only active domains
    else {
      filter.isActive = true;
    }

    const domains = await InternshipsDomain
      .find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: domains.length,
      data: domains,
    });
  } catch (error) {
    console.error("GET DOMAINS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET SINGLE INTERNSHIP DOMAIN ================= */
export const getInternshipsDomainById = async (req, res) => {
  try {
    const domain = await InternshipsDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "InternshipsDomain not found" });
    }
    res.json({ success: true, data: domain });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid ID" });
  }
};

/* ================= UPDATE INTERNSHIP DOMAIN ================= */
export const updateInternshipsDomain = async (req, res) => {
  try {
    const domain = await InternshipsDomain.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!domain) {
      return res.status(404).json({ success: false, message: "InternshipsDomain not found" });
    }

    res.json({
      success: true,
      message: "InternshipsDomain updated successfully",
      data: domain,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= DELETE INTERNSHIP DOMAIN (SOFT DELETE) ================= */
export const deleteInternshipsDomain = async (req, res) => {
  try {
    const domain = await InternshipsDomain.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!domain) {
      return res.status(404).json({ success: false, message: "InternshipsDomain not found" });
    }

    res.json({
      success: true,
      message: "InternshipsDomain deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= GET CURRICULUM ================= */
export const getInternshipCurriculum = async (req, res) => {
  try {
    const domain = await InternshipsDomain.findById(req.params.id).select("curriculum name");
    if (!domain) {
      return res.status(404).json({ success: false, message: "Internship domain not found" });
    }
    res.json({
      success: true,
      data: domain.curriculum || [],
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE / SET FULL CURRICULUM ================= */
export const updateInternshipCurriculum = async (req, res) => {
  try {
    const { curriculum } = req.body;
    const domain = await InternshipsDomain.findByIdAndUpdate(
      req.params.id,
      { curriculum: Array.isArray(curriculum) ? curriculum : [] },
      { new: true, runValidators: true }
    );

    if (!domain) {
      return res.status(404).json({ success: false, message: "Internship domain not found" });
    }

    res.json({
      success: true,
      message: "Internship curriculum updated successfully",
      data: domain.curriculum,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= ADD CURRICULUM WEEK ================= */
export const addCurriculumWeek = async (req, res) => {
  try {
    const { title, sessions = [], week } = req.body;
    const domain = await InternshipsDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Internship domain not found" });
    }

    const nextWeekNumber = week || (domain.curriculum ? domain.curriculum.length + 1 : 1);
    const newWeek = {
      week: nextWeekNumber,
      title: title || `Week ${nextWeekNumber}`,
      sessions: sessions.length ? sessions : [{ title: "Session 1" }],
    };

    domain.curriculum.push(newWeek);
    await domain.save();

    res.status(201).json({
      success: true,
      message: "Curriculum week added successfully",
      data: domain.curriculum,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE CURRICULUM WEEK ================= */
export const updateCurriculumWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { title, week, sessions } = req.body;

    const domain = await InternshipsDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Internship domain not found" });
    }

    const targetWeek = domain.curriculum.id(weekId) || domain.curriculum.find(w => w.id === weekId || String(w._id) === weekId);
    if (!targetWeek) {
      return res.status(404).json({ success: false, message: "Curriculum week not found" });
    }

    if (title !== undefined) targetWeek.title = title;
    if (week !== undefined) targetWeek.week = week;
    if (sessions !== undefined) targetWeek.sessions = sessions;

    await domain.save();

    res.json({
      success: true,
      message: "Curriculum week updated successfully",
      data: domain.curriculum,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= DELETE CURRICULUM WEEK ================= */
export const deleteCurriculumWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const domain = await InternshipsDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Internship domain not found" });
    }

    domain.curriculum = domain.curriculum.filter(
      w => String(w._id) !== weekId && w.id !== weekId
    );
    await domain.save();

    res.json({
      success: true,
      message: "Curriculum week deleted successfully",
      data: domain.curriculum,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= ADD SESSION TO WEEK ================= */
export const addSessionToWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { title } = req.body;

    const domain = await InternshipsDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Internship domain not found" });
    }

    const targetWeek = domain.curriculum.id(weekId) || domain.curriculum.find(w => w.id === weekId || String(w._id) === weekId);
    if (!targetWeek) {
      return res.status(404).json({ success: false, message: "Curriculum week not found" });
    }

    targetWeek.sessions.push({ title: title || `Session ${targetWeek.sessions.length + 1}` });
    await domain.save();

    res.status(201).json({
      success: true,
      message: "Session added successfully",
      data: domain.curriculum,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ================= DELETE SESSION FROM WEEK ================= */
export const deleteSessionFromWeek = async (req, res) => {
  try {
    const { weekId, sessionId } = req.params;

    const domain = await InternshipsDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Internship domain not found" });
    }

    const targetWeek = domain.curriculum.id(weekId) || domain.curriculum.find(w => w.id === weekId || String(w._id) === weekId);
    if (!targetWeek) {
      return res.status(404).json({ success: false, message: "Curriculum week not found" });
    }

    targetWeek.sessions = targetWeek.sessions.filter(
      s => String(s._id) !== sessionId && s.id !== sessionId
    );
    await domain.save();

    res.json({
      success: true,
      message: "Session removed successfully",
      data: domain.curriculum,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
