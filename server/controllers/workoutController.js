const Workout = require("../models/WorkoutModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createWorkout = catchAsync(async (req, res, next) => {
  const newWorkout = await Workout.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      workout: newWorkout,
    },
  });
});
