const mongoose = require("mongoose");

const nutrientValueSchema = new mongoose.Schema(
  {
    amount: Number,
    unit: String,
  },
  { _id: false },
);

const nutrientKeys = [
  "calories",
  "vitamin_A",
  "vitamin_C",
  "vitamin_D",
  "vitamin_E",
  "vitamin_K",
  "vitamin_B1",
  "vitamin_B2",
  "vitamin_B3",
  "vitamin_B5",
  "vitamin_B6",
  "vitamin_B7",
  "vitamin_B9",
  "vitamin_B12",
  "total_fat",
  "saturated_fat",
  "monounsaturated_fat",
  "polyunsaturated_fat",
  "protein",
  "carbohydrates",
  "water",
  "fiber",
];

const schemaDefinition = nutrientKeys.reduce((acc, key) => {
  acc[key] = nutrientValueSchema;
  return acc;
}, {});

const nutrientsSchema = new mongoose.Schema(schemaDefinition, { _id: false });

module.exports = nutrientsSchema;
