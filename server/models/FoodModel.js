const mongoose = require("mongoose");
const nutrientsSchema = require("./nutrientsSchema");

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
