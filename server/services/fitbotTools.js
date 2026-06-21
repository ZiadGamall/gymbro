// services/fitbotTools.js
const { createWorkout } = require("../controllers/workoutController");
const { searchExercisesLogic } = require("../controllers/exerciseController");

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

module.exports = {
  handleSearchExercises,
  handleCreateWorkout,
};
