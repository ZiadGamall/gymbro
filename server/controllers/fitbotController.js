const { log } = require("console");
const { generateFitbotResponse } = require("../services/fitbot.service");
const User = require("../models/UserModel");

const chatWithFitbot = async (req, res) => {
  const user = req.user;

  const { history = [], message } = req.body;

  if (!user || !message) {
    return res.status(400).json({
      error: "Missing user or message",
    });
  }

  try {
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
