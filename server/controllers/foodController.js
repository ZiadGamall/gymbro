const Food = require("../models/FoodModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getFoodByName = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return next(new AppError("Food name is required", 400));
  }

  const results = await Food.find({
    food: { $regex: escapeRegex(name.trim()), $options: "i" },
  }).lean();

  if (results.length === 0) {
    return next(new AppError("No food items found", 404));
  }

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
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getAllFood = catchAsync(async (req, res, next) => {
  const results = await Food.find({}, { _id: 0 }).lean();

  if (results.length === 0) {
    return next(new AppError("No food items found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { count: results.length, data: results },
  });
});
