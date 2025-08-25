export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully!',
      url: req.file.path, // Cloudinary hosted URL
      public_id: req.file.filename, // Cloudinary file ID
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error });
  }
};
