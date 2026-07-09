const express = require("express");
const { uploadImage } = require("../utils/upload");
const foodAnalysisController = require("../controllers/foodAnalysisController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/analyze-food",
  protect,
  (req, res, next) => {
    console.log("Request reached upload middleware");
    next();
  },
  uploadImage.single("image"),
  foodAnalysisController.analyzeUploadedFoodImage,
);

module.exports = router;
