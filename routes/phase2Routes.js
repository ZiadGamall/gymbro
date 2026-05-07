const express = require("express");
const authController = require("../controllers/authController");
const phase2Controller = require("../controllers/phase2Controller");

const router = express.Router();

router.use(authController.protect);

router
  .route("/onboarding")
  .get(phase2Controller.getOnboarding)
  .put(phase2Controller.upsertOnboarding);

router
  .route("/nutrition-entries")
  .get(phase2Controller.getMealEntries)
  .post(phase2Controller.addMealEntry);

router.delete("/nutrition-entries/:id", phase2Controller.deleteMealEntry);
router.get("/nutrition-summary/today", phase2Controller.getNutritionSummaryToday);

router
  .route("/workout-sessions")
  .get(phase2Controller.getWorkoutSessions)
  .post(phase2Controller.addWorkoutSession);

router.patch("/workout-sessions/:id/toggle", phase2Controller.toggleWorkoutCompleted);
router.delete("/workout-sessions/:id", phase2Controller.deleteWorkoutSession);

router.get("/progress/weekly", phase2Controller.getWeeklyProgress);

module.exports = router;
