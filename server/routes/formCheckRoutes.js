const express = require("express");
const formCheckController = require("../controllers/formCheckController");
const { protect } = require("../controllers/authController");
const upload = require("../utils/upload");

const router = express.Router();
// Route: POST /api/form-check/analyze
router.post(
  "/analyze",
  protect,
  upload.single("video"),
  formCheckController.analyzeUserVideo,
);

module.exports = router;
