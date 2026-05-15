const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const OnboardingProfile = require("../models/OnboardingProfileModel");
const MealEntry = require("../models/MealEntryModel");
const WorkoutSession = require("../models/WorkoutSessionModel");

const getToday = () => new Date().toISOString().slice(0, 10);

const get7Days = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
};

exports.getOnboarding = catchAsync(async (req, res) => {
  const profile = await OnboardingProfile.findOne({ user: req.user.id });

  res.status(200).json({
    status: "success",
    data: {
      onboarding: profile,
    },
  });
});

exports.upsertOnboarding = catchAsync(async (req, res) => {
  const allowed = [
    "goal",
    "level",
    "activityDays",
    "dietPreference",
    "allergies",
    "calorieTarget",
    "proteinTarget",
    "carbsTarget",
    "fatTarget",
  ];

  const payload = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
  });

  payload.completedAt = new Date();

  const onboarding = await OnboardingProfile.findOneAndUpdate(
    { user: req.user.id },
    payload,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(200).json({
    status: "success",
    data: {
      onboarding,
    },
  });
});

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

exports.getWorkoutSessions = catchAsync(async (req, res) => {
  const date = req.query.date || getToday();
  const sessions = await WorkoutSession.find({ user: req.user.id, date }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: "success",
    data: {
      count: sessions.length,
      sessions,
    },
  });
});

exports.addWorkoutSession = catchAsync(async (req, res, next) => {
  const { planName, durationMin, intensity, completed, notes, date } = req.body;

  if (!planName || !planName.trim()) {
    return next(new AppError("Plan name is required", 400));
  }

  const session = await WorkoutSession.create({
    user: req.user.id,
    date: date || getToday(),
    planName,
    durationMin,
    intensity,
    completed,
    notes,
  });

  res.status(201).json({
    status: "success",
    data: {
      session,
    },
  });
});

exports.toggleWorkoutCompleted = catchAsync(async (req, res, next) => {
  const session = await WorkoutSession.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!session) {
    return next(new AppError("Workout session not found", 404));
  }

  session.completed = !session.completed;
  await session.save();

  res.status(200).json({
    status: "success",
    data: {
      session,
    },
  });
});

exports.deleteWorkoutSession = catchAsync(async (req, res, next) => {
  const session = await WorkoutSession.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!session) {
    return next(new AppError("Workout session not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getWeeklyProgress = catchAsync(async (req, res) => {
  const days = get7Days();

  const [meals, workouts] = await Promise.all([
    MealEntry.find({ user: req.user.id, date: { $in: days } }),
    WorkoutSession.find({ user: req.user.id, date: { $in: days }, completed: true }),
  ]);

  const progress = days.map((date) => {
    const dayMeals = meals.filter((m) => m.date === date);
    const dayWorkouts = workouts.filter((w) => w.date === date);

    const calories = dayMeals.reduce((sum, m) => sum + Number(m.calories || 0), 0);

    return {
      date,
      calories,
      workouts: dayWorkouts.length,
    };
  });

  res.status(200).json({
    status: "success",
    data: {
      progress,
    },
  });
});
