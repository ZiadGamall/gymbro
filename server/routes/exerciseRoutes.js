const express = require("express");
const router = express.Router();
const { getExercises } = require("../controllers/exerciseController");
const { protect } = require("../controllers/authController");
router.get("/search", protect, getExercises);

module.exports = router;