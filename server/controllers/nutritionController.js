const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MealEntry = require("../models/MealEntryModel");
const Food = require("../models/FoodModel");
const factory = require("./handlerFactory");

const getToday = () => new Date().toISOString().slice(0, 10);

// Basic CRUD operations powered by factory
exports.getMealEntries = factory.getAllFieldFilter(MealEntry);
exports.deleteMealEntry = factory.deleteOne(MealEntry);

exports.addMealEntry = catchAsync(async (req, res, next) => {
  const { foodId, weightConsumed, mealType, date, isCustom, foodName, calories, protein, carbs, fat } = req.body;

  if (isCustom) {
    if (!foodName || calories == null || protein == null || carbs == null || fat == null) {
      return next(new AppError("Missing custom meal data.", 400));
    }

    const newMealEntry = await MealEntry.create({
      user: req.user.id,
      date: date || new Date().toISOString().slice(0, 10),
      mealType: mealType || "snack",
      foodName: foodName,
      calories: Math.round(Number(calories)),
      protein: Math.round(Number(protein) * 10) / 10,
      carbs: Math.round(Number(carbs) * 10) / 10,
      fat: Math.round(Number(fat) * 10) / 10,
    });

    return res.status(201).json({
      status: "success",
      data: {
        mealEntry: newMealEntry,
      },
    });
  }

  // 1. Ensure basic input validation
  if (!foodId) {
    return next(new AppError("Food ID is required to log an item.", 400));
  }
  if (!weightConsumed || weightConsumed <= 0) {
    return next(new AppError("Please provide a valid weight in grams.", 400));
  }

  // 2. Fetch the base nutrients directly from your official Food collection
  const foodItem = await Food.findById(foodId);
  if (!foodItem) {
    return next(new AppError("Food item not found in database.", 404));
  }

  // 3. Extract base values per 100g from your NutrientsSchema structure
  const caloriesPer100g = foodItem.nutrients?.calories?.amount || 0;
  const proteinPer100g = foodItem.nutrients?.protein?.amount || 0;
  const carbsPer100g = foodItem.nutrients?.carbohydrates?.amount || 0;
  const fatPer100g = foodItem.nutrients?.total_fat?.amount || 0;

  // 4. Run the math scale factor (User Weight / 100g)
  const scaleFactor = weightConsumed / 100;

  const calculatedCalories = Math.round(caloriesPer100g * scaleFactor);
  const calculatedProtein = Math.round(proteinPer100g * scaleFactor * 10) / 10;
  const calculatedCarbs = Math.round(carbsPer100g * scaleFactor * 10) / 10;
  const calculatedFat = Math.round(fatPer100g * scaleFactor * 10) / 10;

  // 5. Create the final MealEntry log
  const newMealEntry = await MealEntry.create({
    user: req.user.id,
    date: date || new Date().toISOString().slice(0, 10),
    mealType: mealType || "snack",
    foodName: `${foodItem.food} (${weightConsumed}g)`,
    calories: calculatedCalories,
    protein: calculatedProtein,
    carbs: calculatedCarbs,
    fat: calculatedFat,
  });

  res.status(201).json({
    status: "success",
    data: {
      mealEntry: newMealEntry,
    },
  });
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
