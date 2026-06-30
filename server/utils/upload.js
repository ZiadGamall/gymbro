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

const createFileFilter = ({ extensions, mimePattern, message }) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const hasValidExt = extensions.includes(ext);
    const hasValidMime = mimePattern.test(file.mimetype);

    if (hasValidExt && hasValidMime) {
      return cb(null, true);
    }

    return cb(new Error(message));
  };
};

const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: createFileFilter({
    extensions: ["jpeg", "jpg", "png"],
    mimePattern: /^image\/(jpeg|png)$/,
    message: "Only image files (jpeg, jpg, png) are allowed.",
  }),
});

const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: createFileFilter({
    extensions: ["mp4", "mov", "avi", "flv"],
    mimePattern: /^video\/(mp4|quicktime|x-msvideo|x-flv)$/,
    message: "Only video files (mp4, mov, avi, flv) are allowed.",
  }),
});

module.exports = {
  uploadImage,
  uploadVideo,
};
