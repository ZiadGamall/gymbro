const mongoose = require("mongoose");

const nutritionPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "My Nutrition Plan",
    },
    dailyCalorieTarget: { type: Number },
    dailyProteinTarget: { type: Number },
    dailyCarbsTarget: { type: Number },
    dailyFatTarget: { type: Number },
    meals: [
      {
        mealType: {
          type: String,
          enum: ["breakfast", "lunch", "dinner", "snack"],
        },
        suggestions: [
          {
            foodName: { type: String },
            quantity: { type: String },
            calories: { type: Number },
            protein: { type: Number },
            carbs: { type: Number },
            fat: { type: Number },
          },
        ],
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.NutritionPlan ||
  mongoose.model("NutritionPlan", nutritionPlanSchema);