const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const ML_SERVICE_URL = process.env.CALORIE_SERVICE_URL || "http://localhost:5001";

const predictCalories = catchAsync(async (req, res, next) => {
  const errors = validatePredictBody(req.body);
  if (errors.length > 0) {
    return next(new AppError(`Validation failed: ${errors.join(", ")}`, 422));
  }

  const payload = {
    gender: String(req.body.gender).toLowerCase(),
    age: Number(req.body.age),
    height: Number(req.body.height),
    weight: Number(req.body.weight),
    duration: Number(req.body.duration),
    heart_rate: Number(req.body.heart_rate),
  };

  let mlRes, data;
  try {
    mlRes = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    data = await mlRes.json();
  } catch (err) {
    console.error("[calorieController] ML service unreachable:", err.message);
    return next(new AppError("ML service unavailable. Please try again later.", 503));
  }

  if (!mlRes.ok) {
    return next(new AppError(data.error || "Downstream validation failed", mlRes.status));
  }

  return res.status(200).json(data);
});

const checkHealth = catchAsync(async (req, res, next) => {
  let mlRes, data;
  try {
    mlRes = await fetch(`${ML_SERVICE_URL}/health`);
    data = await mlRes.json();
  } catch (err) {
    return next(new AppError("ML service unreachable", 503));
  }

  return res.status(mlRes.ok ? 200 : 502).json(data);
});

const validatePredictBody = (body) => {
  const errors = [];

  if (body.gender === undefined) {
    errors.push("'gender' is required");
  } else if (!["male", "female"].includes(String(body.gender).toLowerCase())) {
    errors.push("'gender' must be 'male' or 'female'");
  }

  const numericFields = [
    { key: "age", min: 1, max: 120, label: "age (years)" },
    { key: "height", min: 50, max: 250, label: "height (cm)" },
    { key: "weight", min: 10, max: 300, label: "weight (kg)" },
    { key: "duration", min: 1, max: 300, label: "duration (min)" },
    { key: "heart_rate", min: 30, max: 220, label: "heart_rate (bpm)" },
  ];

  for (const { key, min, max, label } of numericFields) {
    if (body[key] === undefined) {
      errors.push(`'${key}' is required`);
    } else {
      const val = Number(body[key]);
      if (isNaN(val)) {
        errors.push(`'${key}' must be a number`);
      } else if (val < min || val > max) {
        errors.push(`'${key}' must be between ${min} and ${max} (${label})`);
      }
    }
  }

  return errors;
};

module.exports = { predictCalories, checkHealth };