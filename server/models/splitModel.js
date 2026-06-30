const mongoose = require("mongoose");

const splitSchema = new mongoose.Schema(
  {
    program: { 
      type: String, 
      required: true // e.g., "6 Day Powerbuilding Split"
    },
    days: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workout" // Connects your Split directly to your Workout documents
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Split", splitSchema);