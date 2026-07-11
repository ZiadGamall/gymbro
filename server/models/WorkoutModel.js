const mongoose = require("mongoose");

const workoutSchema = mongoose.Schema(
  {
    name: { type: String, default: "Custom Workout" },
    numberOfExercises: { type: Number },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    exercises: [
      {
        exerciseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
          required: true,
        },
        exerciseName: { type: String },
        sets: { type: String, required: true },
        repsPerSet: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Workout", workoutSchema);
