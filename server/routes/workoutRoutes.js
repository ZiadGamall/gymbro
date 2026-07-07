const express = require("express");
const workoutController = require("../controllers/workoutController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/create-workout",
  authController.protect,
  workoutController.createWorkout,
);

router.get(
  "/my-workouts",
  authController.protect,
  workoutController.getMyWorkouts,
);

module.exports = router;
