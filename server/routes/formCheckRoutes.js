const express = require("express");
const formCheckController = require("../controllers/formCheckController");
const { protect } = require("../controllers/authController");
const { uploadVideo } = require("../utils/upload");

const router = express.Router();

router.get("/history", protect, formCheckController.getFormCheckHistory);

router.post(
  "/analyze",
  protect,
  uploadVideo.single("video"),
  formCheckController.analyzeUserVideo,
);

module.exports = router;
