const mongoose = require("mongoose");

const mealEntrySchema = new mongoose.Schema(
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
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      default: "snack",
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    calories: {
      type: Number,
      default: 0,
      min: 0,
    },
    protein: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    fat: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

mealEntrySchema.index({ user: 1, date: 1, createdAt: -1 });

module.exports =
  mongoose.models.MealEntry || mongoose.model("MealEntry", mealEntrySchema);
