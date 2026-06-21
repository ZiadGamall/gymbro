const express = require("express");
const authController = require("../controllers/authController");
const workoutSessionController = require("../controllers/workoutSessionController");

const router = express.Router();

router
  .route("/sessions")
  .get(authController.protect, workoutSessionController.getWorkoutSessions)
  .post(authController.protect, workoutSessionController.addWorkoutSession);

router.patch(
  "/sessions/:id/toggle",
  authController.protect,
  workoutSessionController.toggleWorkoutCompleted,
);
router.delete(
  "/sessions/:id",
  authController.protect,
  workoutSessionController.deleteWorkoutSession,
);

router.get(
  "/progress/weekly",
  authController.protect,
  workoutSessionController.getWeeklyProgress,
);

module.exports = router;
