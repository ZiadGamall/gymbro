const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generateFitbotResponse } = require("../services/fitbot.service");

const chatWithFitbot = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { history = [], message } = req.body;

  if (!user || !message) {
    return next(new AppError("Missing user context or message", 400));
  }

  try {
    const reply = await generateFitbotResponse(user, history, message);
    return res.status(200).json({ reply });
  } catch (error) {
    if (error?.status === 429) {
      return next(
        new AppError(
          "FitBot is temporarily unavailable due to API quota limits. Please try again later.",
          429,
        ),
      );
    }
    return next(new AppError("FitBot is unavailable right now.", 500));
  }
});

module.exports = { chatWithFitbot };
