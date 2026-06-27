const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Split = require("../models/SplitModel");
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
