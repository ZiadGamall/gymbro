const express = require("express");
const router = express.Router();
const {
  predictCalories,
  checkHealth,
} = require("../controllers/calorieController");
const { protect } = require("../controllers/authController");

router.post("/predict", protect, predictCalories);
router.get("/health", checkHealth);

module.exports = router;
