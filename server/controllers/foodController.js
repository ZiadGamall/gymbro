const Food = require("../models/FoodModel");
const appError = require("../utils/appError");

exports.getFoodByName = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return next(new appError("Food name is required", 400));
    }

    const results = await Food.find({
      food: { $regex: escapeRegex(name.trim()), $options: "i" },
    }).lean();

    if (results.length === 0) {
      return next(new appError("No food items found", 404));
    }

    // Map fields assuming your underlying Food database quantities represent values per 100g
    const formattedResults = results.map((item) => ({
      foodId: item._id,
      foodName: item.food,
      caloriesPer100g: item.nutrients?.calories?.amount || 0,
      proteinPer100g: item.nutrients?.protein?.amount || 0,
      carbsPer100g: item.nutrients?.carbohydrates?.amount || 0,
      fatPer100g: item.nutrients?.total_fat?.amount || 0,
    }));

    res.status(200).json({
      status: "success",
      data: { count: formattedResults.length, data: formattedResults },
    });
  } catch (err) {
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

    res.status(200).json({
      status: "success",
      data: { count: results.length, data: results },
    });
  } catch (err) {
    console.error("getAllFood error:", err);
    next(new appError(err.message, 500));
  }
};
