const formCheckerService = require("../services/formCheckerService");
const formCheckHistory = require("../models/formCheckHistoryModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");

const removeUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Failed to remove uploaded form-check video:", error.message);
  }
};

exports.analyzeUserVideo = catchAsync(async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("Please upload a video file.", 400));
    }

    const mode = req.body.mode || "Beginner";
    const aiResult = await formCheckerService.forwardVideoToAI(
      req.file.path,
      mode,
    );

    console.log("SUCCESS! Data received from Python:", aiResult);

    const newRecord = await formCheckHistory.create({
      user: req.user.id,
      exercise: aiResult.exercise || "Squats",
      mode: aiResult.mode || mode,
      correct_reps: aiResult.correct_reps !== undefined ? aiResult.correct_reps : 0,
      incorrect_reps: aiResult.incorrect_reps !== undefined ? aiResult.incorrect_reps : 0,
      errors_detected: aiResult.errors_detected || [],
      output_video: aiResult.output_video || null,
    });

    return res.status(200).json({ success: true, data: newRecord });
  } finally {
    removeUploadedFile(req.file?.path);
  }
});