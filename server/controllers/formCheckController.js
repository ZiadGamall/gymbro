const formCheckerService = require("../services/formCheckerService");
const formCheckHistory = require("../models/formCheckHistoryModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../utils/cloudinaryConfig");

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
    const exercise = req.body.exercise || "squats";
    const aiResult = await formCheckerService.forwardVideoToAI(
      req.file.path,
      mode,
      exercise,
      req.user.id,
      {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      },
    );

    console.log("SUCCESS! Data received from Python:", aiResult);
    
    let cloudinaryPublicId = null;

    if (aiResult.output_video) {
      const processedVideoPath = path.join(
        __dirname,
        "../../ai-services/form-checker/processed_outputs",
        aiResult.output_video
      );

      if (fs.existsSync(processedVideoPath)) {
        try {
          const uploadResult = await cloudinary.uploader.upload(processedVideoPath, {
            resource_type: "video",
            type: "authenticated",
            folder: "gymbro_form_checks",
          });
          cloudinaryPublicId = uploadResult.public_id;
          
          // Clean up the local processed file
          removeUploadedFile(processedVideoPath);
        } catch (uploadError) {
          console.error("Cloudinary Upload Error:", uploadError);
          // If upload fails, we still want to save the record, but without the video.
          // Or we can return an error, but let's just log it and proceed.
        }
      }
    }

    const newRecord = await formCheckHistory.create({
      user: req.user.id,
      exercise: aiResult.exercise || exercise,
      mode: aiResult.mode || mode,
      correct_reps: aiResult.correct_reps !== undefined ? aiResult.correct_reps : 0,
      incorrect_reps: aiResult.incorrect_reps !== undefined ? aiResult.incorrect_reps : 0,
      errors_detected: aiResult.errors_detected || {},
      output_video: cloudinaryPublicId,
    });

    return res.status(200).json({ success: true, data: newRecord });
  } finally {
    removeUploadedFile(req.file?.path);
  }
});

exports.getFormCheckHistory = catchAsync(async (req, res) => {
  const records = await formCheckHistory
    .find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    status: "success",
    results: records.length,
    data: records,
  });
});

exports.getVideoUrl = catchAsync(async (req, res, next) => {
  const record = await formCheckHistory.findOne({
    _id: req.params.recordId,
    user: req.user.id,
  });

  if (!record || !record.output_video) {
    return next(new AppError("Video not found or you do not have permission to access it.", 404));
  }

  // Generate a signed URL valid for 1 hour (3600 seconds)
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  
  const videoUrl = cloudinary.url(record.output_video, {
    resource_type: "video",
    type: "authenticated",
    format: "mp4",
    video_codec: "auto",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });

  res.status(200).json({
    status: "success",
    videoUrl,
  });
});
