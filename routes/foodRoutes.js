const express = require("express");
const foodController = require("../controllers/foodControllers");

const router = express.Router();

router.post("/search", foodController.getFoodByName);
router.get("/all", foodController.getAllFood);

module.exports = router;
