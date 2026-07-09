const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please provide your first name"],
    minlength: 3,
  },
  lastName: {
    type: String,
    required: [true, "Please provide your last name"],
    minlength: 3,
  },
  username: {
    type: String,
    required: [true, "Please provide your username"],
    unique: true,
    minlength: 3,
  },

  dateOfBirth: Date,
  height: Number,
  weight: Number,

  gender: {
    type: String,
    lowercase: true,
    enum: {
      values: ["male", "female"],
      message: "Gender must be either Male or Female",
    },
    required: [true, "Please provide your gender"],
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    select: false,
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords do not match!",
    },
  },
  photo: String,
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  workoutList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workout" }],
  savedSplits: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Split",
    },
  ],
  savedNutritionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NutritionPlan",
  },

  activeSplit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Split",
  },
  currentDayIndex: {
    type: Number,
    default: 0,
  },

  verifyToken: String,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Middlewares
// Hash password before saving and set passwordChangedAt
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;

  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

// Create verification token for new users
userSchema.pre("save", function () {
  if (this.isNew) {
    this.verifyToken = crypto.randomBytes(32).toString("hex");
  }
});

// Compare passwords
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return undefined;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

// Ensure virtual fields are included when converting documents to JSON or Objects
userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
