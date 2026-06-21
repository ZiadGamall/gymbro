const express = require("express");
const workoutController = require("../controllers/workoutController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/create-workout",
  authController.protect,
  workoutController.createWorkout,
);

module.exports = router;
