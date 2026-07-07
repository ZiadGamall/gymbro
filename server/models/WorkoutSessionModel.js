const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
    },
    workoutName: {
      type: String,
      default: "Manual Workout",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number,
      required: true,
    },
    exercises: [
      {
        exerciseId: { type: String },
        name: { type: String },
        sets: [
          {
            setNumber: { type: Number, required: true },
            weight: { type: Number, required: true },
            reps: { type: Number, required: true },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

workoutSessionSchema.index({ user: 1, date: 1, createdAt: -1 });

module.exports = mongoose.model("WorkoutSession", workoutSessionSchema);
