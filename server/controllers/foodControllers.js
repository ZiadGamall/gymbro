const Food = require("../models/FoodModel");
const appError = require("../utils/appError");

// POST /api/food/search
exports.getFoodByName = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return next(new appError("Food name is required", 400));
    }

    const results = await Food.find(
      { food: { $regex: escapeRegex(name.trim()), $options: "i" } },
      { _id: 0 },
    ).lean();

    if (results.length === 0) {
      return next(new appError("No food items found", 404));
    }

    res
      .status(200)
      .json({
        status: "success",
        data: { count: results.length, data: results },
      });
  } catch (err) {
    console.error("getFoodByName error:", err);
    next(new appError(err.message, 500));
  }
};

// Helper function to escape regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Get all food items
exports.getAllFood = async (req, res, next) => {
  try {
    const results = await Food.find({}, { _id: 0 }).lean();

    if (results.length === 0) {
      return next(new appError("No food items found", 404));
    }

    res
      .status(200)
      .json({
        status: "success",
        data: { count: results.length, data: results },
      });
  } catch (err) {
    console.error("getAllFood error:", err);
    next(new appError(err.message, 500));
  }
};
