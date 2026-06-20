// controllers/fitbotController.js
const { generateFitbotResponse } = require("../services/fitbot.service");

const chatWithFitbot = async (req, res) => {
  // req.user comes from your 'protect' middleware and has the Mongoose _id
  const user = req.user;
  const { history = [], message } = req.body;

  if (!user || !message) {
    return res.status(400).json({
      error: "Missing user context or message",
    });
  }

  try {
    // Pass the complete user object through to the service loop
    const reply = await generateFitbotResponse(user, history, message);

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("FitBot API error:", error);

    const isQuotaError = error?.status === 429;

    return res.status(500).json({
      error: isQuotaError
        ? "FitBot is temporarily unavailable due to API quota limits. Please try again later."
        : "FitBot is unavailable right now.",
    });
  }
};

module.exports = {
  chatWithFitbot,
};
