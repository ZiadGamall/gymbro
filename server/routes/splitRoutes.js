const express = require("express");
const splitController = require("../controllers/splitController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.get("/", splitController.getAllSplits);

// Protected static routes MUST come before /:id
router.get("/saved", protect, splitController.getSavedSplits);
router.get("/today", protect, splitController.getTodayWorkout);
router.post("/set-active", protect, splitController.setActiveSplit);
router.patch("/advance-day", protect, splitController.advanceSplitDay);

router.get("/:id", splitController.getSplit);
router.post("/:id/save", protect, splitController.saveSplitToProfile);

module.exports = router;
