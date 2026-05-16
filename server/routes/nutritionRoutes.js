const express = require("express");
const authController = require("../controllers/authController");
const nutritionController = require("../controllers/nutritionController");

const router = express.Router();

router
  .route("/entries")
  .get(authController.protect, nutritionController.getMealEntries)
  .post(authController.protect, nutritionController.addMealEntry);

router.delete(
  "/entries/:id",
  authController.protect,
  nutritionController.deleteMealEntry,
);
router.get(
  "/summary/today",
  authController.protect,
  nutritionController.getNutritionSummaryToday,
);

module.exports = router;
