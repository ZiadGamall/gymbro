const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    durationMin: {
      type: Number,
      default: 30,
      min: 0,
    },
    intensity: {
      type: String,
      enum: ["light", "moderate", "high"],
      default: "moderate",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

workoutSessionSchema.index({ user: 1, date: 1, createdAt: -1 });

module.exports =
  mongoose.models.WorkoutSession ||
  mongoose.model("WorkoutSession", workoutSessionSchema);
