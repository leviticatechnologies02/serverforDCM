import InternshipsDomain from "../../models/internshipsDomain.js";




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


/* ================= GET ALL InternshipsDomainS ================= */
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

/* ================= GET SINGLE InternshipsDomain ================= */
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

/* ================= UPDATE InternshipsDomain ================= */
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

/* ================= DELETE InternshipsDomain (SOFT DELETE) ================= */
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
