const express = require("express");
const splitController = require("../controllers/splitController");
const { protect } = require("../controllers/authController"); // Wherever your protect middleware lives

const router = express.Router();

// Public routes - Anyone can browse the available workout splits
router.get("/", splitController.getAllSplits);
router.get("/:id", splitController.getSplit);

router.post("/:id/save", protect, splitController.saveSplitToProfile);
router.get("/saved", protect, splitController.getSavedSplits);
router.post("/set-active", protect, splitController.setActiveSplit);
router.get("/today", protect, splitController.getTodayWorkout);
router.patch("/advance-day", protect, splitController.advanceSplitDay);

module.exports = router;
