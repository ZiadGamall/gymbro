const express = require("express");
const authController = require("../controllers/authController");
const onboardingController = require("../controllers/onboardingController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, onboardingController.getOnboarding)
  .put(authController.protect, onboardingController.upsertOnboarding);

module.exports = router;
