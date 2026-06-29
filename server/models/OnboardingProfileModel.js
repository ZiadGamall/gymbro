const mongoose = require("mongoose");

const onboardingProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    goal: {
      type: String,
      enum: ["general_health", "fat_loss", "muscle_tone"],
      default: "general_health",
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate"],
      default: "beginner",
    },
    activityDays: {
      type: Number,
      min: 1,
      max: 7,
      default: 3,
    },
    dietPreference: {
      type: String,
      enum: ["balanced", "high_protein", "vegetarian", "vegan"],
      default: "balanced",
    },
    allergies: {
      type: String,
      default: "",
    },
    calorieTarget: {
      type: Number,
      default: 2200,
      min: 0,
    },
    proteinTarget: {
      type: Number,
      default: 120,
      min: 0,
    },
    carbsTarget: {
      type: Number,
      default: 250,
      min: 0,
    },
    limitations: {
      type: String,
      default: "",
    },
    fatTarget: {
      type: Number,
      default: 70,
      min: 0,
    },
    completedAt: Date,
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.OnboardingProfile ||
  mongoose.model("OnboardingProfile", onboardingProfileSchema);
