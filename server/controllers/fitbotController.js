const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const OnboardingProfile = require("../models/onboardingProfileModel");
const { generateFitbotResponse } = require("../services/fitbot.service");

const chatWithFitbot = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { history = [], message } = req.body;

  if (!user || !message) {
    return next(new AppError("Missing user context or message", 400));
  }

  const onboarding = await OnboardingProfile.findOne({ user: user._id });
  let reply;
  try {
    reply = await generateFitbotResponse(user, onboarding, history, message);
  } catch (err) {
    console.error("[FitBot] generation failed:", err.message);
    reply =
      "I'm having a brief connection issue reaching my training brain. Please ask again in a moment — your chat history is saved.";
  }
  return res.status(200).json({ reply });
});

module.exports = { chatWithFitbot };
