const mongoose = require("mongoose");

const formCheckHistorySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exercise: {
      type: String,
      default: "Squats",
      required: true,
    },
    mode: {
      type: String,
      enum: ["Beginner", "Pro"],
      required: true,
    },
    correct_reps: {
      type: Number,
      required: true,
    },
    incorrect_reps: {
      type: Number,
      required: true,
    },
    // CHANGED: Dynamic object mapping rep labels to specific error arrays
    errors_detected: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    output_video: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormCheckHistory", formCheckHistorySchema);