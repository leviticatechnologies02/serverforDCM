import multer from "multer";

// Use memory storage so we can stream files to Cloudinary safely without writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow common document and media types
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  // If MIME type is acceptable or has matching extension
  const isAllowedExt = /\.(pdf|doc|docx|zip|rar|txt|png|jpe?g|webp)$/i.test(
    file.originalname
  );

  if (allowedMimeTypes.includes(file.mimetype) || isAllowedExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file format. Allowed formats: PDF, DOC, DOCX, ZIP, TXT, PNG, JPG"
      ),
      false
    );
  }
};

const assignmentUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter,
});

export default assignmentUpload;
