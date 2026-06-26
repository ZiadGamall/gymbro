const express = require("express");
const authController = require("../controllers/authController");
const workoutSessionController = require("../controllers/workoutSessionController");

const router = express.Router();

// Get history of sessions or save a new completed Excel-style grid log
router
  .route("/sessions")
  .get(authController.protect, workoutSessionController.getWorkoutSessions)
  .post(authController.protect, workoutSessionController.addWorkoutSession);

// Delete an erroneous workout session log
router.delete(
  "/sessions/:id",
  authController.protect,
  workoutSessionController.deleteWorkoutSession,
);

// Get analytics data for the 7-day dashboard preview
router.get(
  "/progress/weekly",
  authController.protect,
  workoutSessionController.getWeeklyProgress,
);

module.exports = router;
