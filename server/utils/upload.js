const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

module.exports = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 1. Restrict file size to 100MB maximum
  },
  fileFilter: (req, file, cb) => {
    // 2. Allow both your original images AND video types
    const allowedTypes = /jpeg|jpg|png|mp4|mov|avi|flv/;
    const extName = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Only images (jpeg, jpg, png) and videos (mp4, mov, avi, flv) are allowed!",
        ),
      );
    }
  },
});
