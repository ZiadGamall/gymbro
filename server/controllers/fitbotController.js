const { generateFitbotResponse } = require("../services/fitbot.service.js");

const chatWithFitbot = async (req, res) => {
  const { user, history = [], message } = req.body;

  if (!user || !message) {
    return res.status(400).json({
      error: "Missing user or message",
    });
  }

  try {
    const reply = await generateFitbotResponse(
      user,
      history,
      message
    );

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