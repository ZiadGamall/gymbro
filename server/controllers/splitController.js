const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Split = require("../models/splitModel");
const User = require("../models/userModel");
const factory = require("./handlerFactory");

// 1. Standard Factory Operations
exports.getAllSplits = factory.getAllFieldFilter(Split, {
  path: "days",
  select: "name numberOfExercises",
});

// Make sure your factory's getOne supports populating fields (e.g., factory.getOne(Model, popOptions))
exports.getSplit = factory.getOne(Split, {
  path: "days",
  select: "name numberOfExercises exercises",
});

// 2. Custom Operation (Can't use a generic factory handler here since it updates the User model)
exports.saveSplitToProfile = catchAsync(async (req, res, next) => {
  const split = await Split.findById(req.params.id);
  if (!split) {
    return next(new AppError("No split found with that ID", 404));
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { savedSplits: split._id },
  });

  res.status(200).json({
    status: "success",
    message: "Split saved to profile successfully.",
  });
});

// Get all saved splits for the user
exports.getSavedSplits = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "savedSplits",
    select: "program days",
    populate: {
      path: "days",
      select: "name numberOfExercises",
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      savedSplits: user.savedSplits,
    },
  });
});

// Set a split as active with a chosen start day
exports.setActiveSplit = catchAsync(async (req, res, next) => {
  const { splitId, startDayIndex } = req.body;

  if (!splitId) {
    return next(new AppError("Split ID is required", 400));
  }

  const split = await Split.findById(splitId).populate("days");
  if (!split) {
    return next(new AppError("No split found with that ID", 404));
  }

  // Validate startDayIndex
  const dayIndex = startDayIndex || 0;
  if (dayIndex < 0 || dayIndex >= split.days.length) {
    return next(
      new AppError(
        `Start day must be between 0 and ${split.days.length - 1}`,
        400,
      ),
    );
  }

  // Make sure the split is in the user's saved splits
  const user = await User.findById(req.user._id);
  const isSaved = user.savedSplits.some(
    (id) => id.toString() === splitId.toString(),
  );
  if (!isSaved) {
    return next(new AppError("This split is not in your saved splits", 400));
  }

  await User.findByIdAndUpdate(req.user._id, {
    activeSplit: splitId,
    currentDayIndex: dayIndex,
  });

  res.status(200).json({
    status: "success",
    message: `Split "${split.program}" set as active starting from Day ${dayIndex + 1}: ${split.days[dayIndex].name}`,
  });
});

// Get today's workout from active split
exports.getTodayWorkout = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "activeSplit",
    populate: {
      path: "days",
      populate: {
        path: "exercises.exerciseId",
        model: "Exercise",
        select: "name bodyPart target gifUrl equipment instructionSteps",
      },
    },
  });

  if (!user.activeSplit) {
    return next(
      new AppError(
        "You don't have an active split. Please set one first.",
        404,
      ),
    );
  }

  const split = user.activeSplit;
  const todayWorkout = split.days[user.currentDayIndex];

  if (!todayWorkout) {
    return next(
      new AppError(
        "No workout found for today's index. Please reset your split.",
        400,
      ),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      splitName: split.program,
      currentDay: user.currentDayIndex + 1,
      totalDays: split.days.length,
      workout: todayWorkout,
    },
  });
});

// Advance to next day after logging a session
exports.advanceSplitDay = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("activeSplit");

  if (!user.activeSplit) {
    return next(new AppError("You don't have an active split.", 404));
  }

  const totalDays = user.activeSplit.days.length;
  const nextIndex = (user.currentDayIndex + 1) % totalDays;

  await User.findByIdAndUpdate(req.user._id, {
    currentDayIndex: nextIndex,
  });

  res.status(200).json({
    status: "success",
    message: `Advanced to Day ${nextIndex + 1} of ${totalDays}`,
    data: {
      currentDayIndex: nextIndex,
    },
  });
});
