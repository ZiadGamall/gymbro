const express = require("express");
const authController = require("../controllers/authController");
const workoutController = require("../controllers/workoutController");

const router = express.Router();

router
  .route("/sessions")
  .get(authController.protect, workoutController.getWorkoutSessions)
  .post(authController.protect, workoutController.addWorkoutSession);

router.patch(
  "/sessions/:id/toggle",
  authController.protect,
  workoutController.toggleWorkoutCompleted,
);
router.delete(
  "/sessions/:id",
  authController.protect,
  workoutController.deleteWorkoutSession,
);

router.get(
  "/progress/weekly",
  authController.protect,
  workoutController.getWeeklyProgress,
);

module.exports = router;
