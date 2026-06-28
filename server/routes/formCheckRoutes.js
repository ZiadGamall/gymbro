const express = require("express");
const formCheckController = require("../controllers/formCheckController");
const { protect } = require("../controllers/authController");
const { uploadVideo } = require("../utils/upload");

const router = express.Router();
// Route: POST /api/form-check/analyze
router.post(
  "/analyze",
  protect,
  uploadVideo.single("video"),
  formCheckController.analyzeUserVideo,
);

module.exports = router;
