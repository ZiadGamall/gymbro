const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Workout = require("../models/WorkoutModel");
const User = require("../models/userModel");

exports.createWorkout = catchAsync(async (req, res, next) => {
  // 1. Create a copy of the incoming body data
  const workoutData = { ...req.body };

  // 2. If a logged-in user exists, attach their ID directly to the data object
  if (req.user && req.user._id) {
    workoutData.user = req.user._id;
  }

  // 3. Create the workout once with all fields populated!
  const newWorkout = await Workout.create(workoutData);

  // 4. Push the new workout ID into the user's personal list
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

exports.getMyWorkouts = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "workoutList",
    select: "name numberOfExercises exercises createdAt",
    populate: { path: "exercises.exerciseId", select: "name instructionSteps bodyPart target equipment gifUrl" }
  });

  res.status(200).json({
    status: "success",
    results: user?.workoutList?.length || 0,
    data: {
      workouts: user?.workoutList || [],
    },
  });
});
