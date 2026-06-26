const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MealEntry = require("../models/MealEntryModel");
const factory = require("./handlerFactory");

const getToday = () => new Date().toISOString().slice(0, 10);

// Basic CRUD operations powered by factory
exports.getMealEntries = factory.getAllFieldFilter(MealEntry);
exports.deleteMealEntry = factory.deleteOne(MealEntry);

// Custom validation wrapper around factory creation
exports.addMealEntry = catchAsync(async (req, res, next) => {
  if (!req.body.foodName || !req.body.foodName.trim()) {
    return next(new AppError("Food name is required", 400));
  }
  
  if (!req.body.date) req.body.date = getToday();

  // Forward sanitized data execution to factory wrapper
  return factory.createOne(MealEntry)(req, res, next);
});

// Keeping complex calculation logic separate and custom
exports.getNutritionSummaryToday = catchAsync(async (req, res) => {
  const date = req.query.date || getToday();

  const entries = await MealEntry.find({ user: req.user.id, date });

  const totals = entries.reduce(
    (acc, entry) => {
      acc.calories += Number(entry.calories || 0);
      acc.protein += Number(entry.protein || 0);
      acc.carbs += Number(entry.carbs || 0);
      acc.fat += Number(entry.fat || 0);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  res.status(200).json({
    status: "success",
    data: {
      date,
      totals,
    },
  });
});