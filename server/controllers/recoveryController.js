const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getDailyRecoveryRecommendation = catchAsync(async (req, res, next) => {
  // 1. Fetch user from DB
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // 2. Validate that required predictive values exist
  if (!user.gender || !user.age) {
    return next(
      new AppError(
        "Please complete your profile details (Gender and Date of Birth) first.",
        400,
      ),
    );
  }

  // 3. Fetch tracking stats (Mocked)
  const {
    total_sleep_min,
    deep_sleep_min,
    rem_sleep_min,
    hr_avg_bpm,
    sleep_score,
    avg_stress_score,
    steps,
    active_minutes,
  } = req.body;

  const latestZeppData = {
    total_sleep_min,
    deep_sleep_min,
    rem_sleep_min,
    hr_avg_bpm,
    sleep_score,
    avg_stress_score,
    steps,
    active_minutes,
  };

  const RECOVERY_SERVICE_URL =
    process.env.RECOVERY_SERVICE_URL || "http://127.0.0.1:8001/predict-recovery";

  // 4. Send directly to FastAPI microservice using the virtual property
  const response = await fetch(RECOVERY_SERVICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile: {
        Gender: user.gender === "male" ? "Male" : "Female",
        Age: user.age, // Accessing our clean dynamic virtual field directly!
      },
      zepp_sleep: latestZeppData,
    }),
  });

  if (!response.ok) {
    return next(
      new AppError(
        `AI Engine communication failure (Status: ${response.status})`,
        502,
      ),
    );
  }

  const result = await response.json();

  res.status(200).json({
    status: "success",
    data: {
      recommendation: result.data.recommendation,
      emoji: result.data.emoji,
      color: result.data.color,
      message: result.data.message,
      confidence: result.data.confidence,
      class_probs: result.data.class_probs,
    },
  });
});
