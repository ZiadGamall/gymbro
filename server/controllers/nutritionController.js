const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MealEntry = require("../models/MealEntryModel");

const getToday = () => new Date().toISOString().slice(0, 10);

exports.getMealEntries = catchAsync(async (req, res) => {
  const date = req.query.date || getToday();

  const entries = await MealEntry.find({ user: req.user.id, date }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: "success",
    data: {
      count: entries.length,
      entries,
    },
  });
});

exports.addMealEntry = catchAsync(async (req, res, next) => {
  const { mealType, foodName, calories, protein, carbs, fat, date } = req.body;

  if (!foodName || !foodName.trim()) {
    return next(new AppError("Food name is required", 400));
  }

  const entry = await MealEntry.create({
    user: req.user.id,
    date: date || getToday(),
    mealType,
    foodName,
    calories,
    protein,
    carbs,
    fat,
  });

  res.status(201).json({
    status: "success",
    data: {
      entry,
    },
  });
});

exports.deleteMealEntry = catchAsync(async (req, res, next) => {
  const entry = await MealEntry.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!entry) {
    return next(new AppError("Meal entry not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

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
