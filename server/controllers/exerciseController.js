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
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const regex = new RegExp(escapeRegex(searchTerm), "i");
  
  const query = {
    $or: [
      { name: regex },
      { bodyPart: regex },
      { target: regex },
    ],
  };

  const exercises = await Exercise.find(query)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Exercise.countDocuments(query);

  res.status(200).json({
    status: "success",
    results: exercises.length,
    total,
    data: { exercises },
  });
});
