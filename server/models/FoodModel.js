const mongoose = require("mongoose");
const nutrientsSchema = require("./NutrientsSchema");

const foodSchema = new mongoose.Schema(
  {
    food: {
      type: String,
      required: true,
    },
    nutrients: nutrientsSchema,
  },
  { timestamps: true },
);

foodSchema.index({ food: "text" });

module.exports =
  mongoose.models.Food || mongoose.model("Food", foodSchema, "food");
