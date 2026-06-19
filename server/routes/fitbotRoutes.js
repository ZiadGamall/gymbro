const express = require("express");
const { chatWithFitbot } = require("../controllers/fitbotController");

const router = express.Router();

router.post("/chat", chatWithFitbot);

module.exports = router;