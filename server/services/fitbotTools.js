const { createWorkout } = require("../controllers/workoutController");
const { searchExercisesLogic } = require("../controllers/exerciseController");
const {
  getNutritionSummaryToday,
  addMealEntry,
} = require("../controllers/nutritionController");
const { getFoodByName } = require("../controllers/foodController");
const {
  addWorkoutSession,
} = require("../controllers/workoutSessionController");
const Split = require("../models/splitModel");
const User = require("../models/userModel");
const OnboardingProfile = require("../models/OnboardingProfileModel");
const NutritionPlan = require("../models/NutritionPlanModel");

/**
 * Invokes the database query logic inside exerciseController
 */
async function handleSearchExercises(args) {
  try {
    return await searchExercisesLogic(args.searchTerm);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Wraps your existing Express createWorkout middleware into a Promise
 */
async function handleCreateWorkout(args, user) {
  return new Promise((resolve) => {
    // We inject the full user object into mockReq here
    // so the controller can access req.user._id
    const mockReq = {
      body: args,
      user: user,
    };

    const mockRes = {
      status: function () {
        return this;
      },
      json: function (data) {
        resolve({ success: true, databaseResponse: data });
      },
    };

    const mockNext = (err) => {
      resolve({
        success: false,
        error: err.message || "Failed to create workout",
      });
    };

    // Trigger your existing controller
    createWorkout(mockReq, mockRes, mockNext);
  });
}

async function handleGetNutritionSummary(user) {
  return new Promise((resolve) => {
    const mockReq = { user, query: {} }; // empty query = defaults to today
    const mockRes = {
      status: function () {
        return this;
      },
      json: function (data) {
        resolve({ success: true, ...data });
      },
    };
    const mockNext = (err) => resolve({ success: false, error: err.message });
    getNutritionSummaryToday(mockReq, mockRes, mockNext);
  });
}

async function handleSearchFood(args) {
  return new Promise((resolve) => {
    const mockReq = { body: { name: args.foodName } };
    const mockRes = {
      status: function () {
        return this;
      },
      json: function (data) {
        resolve({ success: true, ...data });
      },
    };
    const mockNext = (err) => resolve({ success: false, error: err.message });
    getFoodByName(mockReq, mockRes, mockNext);
  });
}

async function handleLogMealEntry(args, user) {
  return new Promise((resolve) => {
    const mockReq = { body: args, user };
    const mockRes = {
      status: function () {
        return this;
      },
      json: function (data) {
        resolve({ success: true, ...data });
      },
    };
    const mockNext = (err) => resolve({ success: false, error: err.message });
    addMealEntry(mockReq, mockRes, mockNext);
  });
}

async function handleGetSplits(user) {
  try {
    const [splits, onboarding] = await Promise.all([
      Split.find()
        .populate({ path: "days", select: "name numberOfExercises" })
        .lean(),
      OnboardingProfile.findOne({ user: user._id }).lean(),
    ]);

    return {
      success: true,
      splits,
      userProfile: onboarding
        ? {
            goal: onboarding.goal,
            level: onboarding.level,
            activityDays: onboarding.activityDays,
          }
        : null,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleLogWorkoutSession(args, user) {
  return new Promise((resolve) => {
    const mockReq = { body: args, user };
    const mockRes = {
      status: function () {
        return this;
      },
      json: function (data) {
        resolve({ success: true, ...data });
      },
    };
    const mockNext = (err) => resolve({ success: false, error: err.message });
    addWorkoutSession(mockReq, mockRes, mockNext);
  });
}

async function handleSaveSplit(args, user) {
  try {
    const split = await Split.findById(args.splitId);
    if (!split) return { success: false, error: "Split not found" };

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { savedSplits: split._id },
    });

    return {
      success: true,
      message: `Split "${split.program}" saved to your profile.`,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleSaveNutritionPlan(args, user) {
  try {
    // Delete old plan if exists
    await NutritionPlan.deleteOne({ user: user._id });

    const plan = await NutritionPlan.create({
      user: user._id,
      ...args,
    });

    await User.findByIdAndUpdate(user._id, {
      savedNutritionPlan: plan._id,
    });

    return {
      success: true,
      message: "Nutrition plan saved to your profile.",
      plan,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  handleSearchExercises,
  handleCreateWorkout,
  handleGetNutritionSummary,
  handleSearchFood,
  handleLogMealEntry,
  handleGetSplits,
  handleLogWorkoutSession,
  handleSaveSplit,
  handleSaveNutritionPlan,
};
