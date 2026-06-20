const express = require("express");
const { chatWithFitbot } = require("../controllers/fitbotController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.post("/chat", protect, chatWithFitbot);

module.exports = router;
