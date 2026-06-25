const formCheckerService = require("../services/formCheckerService");
const formCheckHistory = require("../models/formCheckHistoryModel");
const catchAsync = require("../utils/catchAsync");

exports.analyzeUserVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload a video file." });
    }

    const mode = req.body.mode || "Beginner";
    const aiResult = await formCheckerService.forwardVideoToAI(
      req.file.path,
      mode,
    );

    console.log("SUCCESS! Data received from Python:", aiResult);

    // Save aligned metrics to MongoDB
    const newRecord = await formCheckHistory.create({
      user: req.user.id,
      exercise: aiResult.exercise || "Squats",
      mode: aiResult.mode || mode,
      correct_reps:
        aiResult.correct_reps !== undefined ? aiResult.correct_reps : 0,
      incorrect_reps:
        aiResult.incorrect_reps !== undefined ? aiResult.incorrect_reps : 0,
      errors_detected: aiResult.errors_detected || [], // Aligned with FastAPI response
      output_video: aiResult.output_video || null, // Storing video file pointer
    });

    return res.status(200).json({ success: true, data: newRecord });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};
