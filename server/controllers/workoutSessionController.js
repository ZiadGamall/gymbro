const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MealEntry = require("../models/MealEntryModel");
const WorkoutSession = require("../models/WorkoutSessionModel"); // Adjusted to your correct model name
const factory = require("./handlerFactory");

const getToday = () => new Date().toISOString().slice(0, 10);

const get7Days = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
};

const toDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

// 1. List sessions with optional YYYY-MM-DD filter
exports.getWorkoutSessions = catchAsync(async (req, res) => {
  const filter = { user: req.user.id };

  if (req.query.date) {
    const day = String(req.query.date).slice(0, 10);
    const start = new Date(`${day}T00:00:00.000Z`);
    const end = new Date(`${day}T23:59:59.999Z`);
    filter.date = { $gte: start, $lte: end };
  }

  const docs = await WorkoutSession.find(filter)
    .populate({ path: "exercises.exerciseId", select: "name instructionSteps bodyPart target equipment gifUrl" })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: docs.length,
    data: docs,
  });
});

exports.deleteWorkoutSession = factory.deleteOne(WorkoutSession);

// 2. The Log/Add controller updated to use your robust nested exercises payload
exports.addWorkoutSession = catchAsync(async (req, res, next) => {
  const { workoutId, workoutName, duration, exercises, date } = req.body;

  // Validation matching your Excel-sheet design requirements
  if (!duration || duration <= 0) {
    return next(
      new AppError("Please provide a valid workout duration in minutes.", 400),
    );
  }

  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    return next(
      new AppError(
        "A workout session must include at least one logged exercise.",
        400,
      ),
    );
  }

  // Deep validation logic for the incoming data table grid
  for (const exerciseItem of exercises) {
    if (
      !exerciseItem.sets ||
      !Array.isArray(exerciseItem.sets) ||
      exerciseItem.sets.length === 0
    ) {
      return next(
        new AppError(
          `Exercise '${exerciseItem.name || "Unknown"}' must contain at least one logged set.`,
          400,
        ),
      );
    }
    for (const set of exerciseItem.sets) {
      if (
        set.weight === undefined ||
        set.reps === undefined ||
        set.weight < 0 ||
        set.reps < 0
      ) {
        return next(
          new AppError(
            "Weights and repetitions must be valid positive numbers.",
            400,
          ),
        );
      }
    }
  }

  const session = await WorkoutSession.create({
    user: req.user.id,
    date: date || getToday(),
    workoutId: workoutId || null,
    workoutName: workoutName || "Manual Workout",
    duration,
    exercises,
  });

  res.status(201).json({
    status: "success",
    data: {
      session,
    },
  });
});

// 3. Weekly Progress Metrics Dashboard
exports.getWeeklyProgress = catchAsync(async (req, res) => {
  const days = get7Days();

  // Queries both collections in parallel across the last 7 calendar dates
  const [meals, workouts] = await Promise.all([
    MealEntry.find({ user: req.user.id, date: { $in: days } }),
    WorkoutSession.find({
      user: req.user.id,
      date: { $in: days },
      // Note: Removed 'completed: true' since your new schema tracks actual logs directly upon completion!
    }),
  ]);

  const progress = days.map((date) => {
    const dayMeals = meals.filter((m) => m.date === date);
    const dayWorkouts = workouts.filter((w) => toDateKey(w.date) === date);

    const calories = dayMeals.reduce(
      (sum, m) => sum + Number(m.calories || 0),
      0,
    );

    return {
      date,
      calories,
      workouts: dayWorkouts.length, // Counts how many sessions were logged on that day
    };
  });

  res.status(200).json({
    status: "success",
    data: {
      progress,
    },
  });
});
