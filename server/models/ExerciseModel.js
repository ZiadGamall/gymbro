const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bodyPart: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    secondaryMuscles: [
      {
        type: String,
      },
    ],
    equipment: { type: String, required: true },
    instructionSteps: [
      {
        type: String,
      },
    ],
    gifUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Exercise", exerciseSchema);
