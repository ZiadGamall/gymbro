const express = require("express");
const {
  getDailyRecoveryRecommendation,
} = require("../controllers/recoveryController");
const { protect } = require("../controllers/authController");

const router = express.Router();

// Route that frontend calls to get the recovery status
router.post("/daily-status", protect, getDailyRecoveryRecommendation);

module.exports = router;
