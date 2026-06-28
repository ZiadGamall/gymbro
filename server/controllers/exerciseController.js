// controllers/exerciseController.js
const Exercise = require("../models/ExerciseModel");
const catchAsync = require("../utils/catchAsync");

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

exports.searchExercisesLogic = async (searchTerm) => {
  const regex = new RegExp(escapeRegex(searchTerm), "i");

  return await Exercise.find({
    $or: [
      { name: regex },
      { bodyPart: regex },
      { target: regex },
    ],
  })
    // Select the fields the LLM needs to make its decision
    .select("name bodyPart target id")
    .limit(15)
    .lean();
};

exports.getExercises = catchAsync(async (req, res, next) => {
  const searchTerm = req.query.search || "";
  const exercises = await exports.searchExercisesLogic(searchTerm);

  res.status(200).json({
    status: "success",
    results: exercises.length,
    data: { exercises },
  });
});
