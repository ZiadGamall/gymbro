const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Workout = require("../models/WorkoutModel");
const User = require("../models/UserModel");

exports.createWorkout = catchAsync(async (req, res, next) => {
  const newWorkout = await Workout.create(req.body);

  // This reads the user object we passed through fitbotTools!
  if (req.user && req.user._id) {
    await User.findByIdAndUpdate(req.user._id, {
      $push: { workoutList: newWorkout._id },
    });
  }

  res.status(201).json({
    status: "success",
    data: {
      workout: newWorkout,
    },
  });
});
