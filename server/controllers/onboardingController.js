const catchAsync = require("../utils/catchAsync");
const OnboardingProfile = require("../models/onboardingProfileModel");

// Streamlined read handler using core query targeting
exports.getOnboarding = catchAsync(async (req, res) => {
  const profile = await OnboardingProfile.findOne({ user: req.user.id });

  res.status(200).json({
    status: "success",
    data: {
      onboarding: profile,
    },
  });
});

// Custom properties allowlist logic remains isolated safely
exports.upsertOnboarding = catchAsync(async (req, res) => {
  const allowed = [
    "goal",
    "level",
    "activityDays",
    "dietPreference",
    "allergies",
    "calorieTarget",
    "proteinTarget",
    "carbsTarget",
    "fatTarget",
    "limitations",
  ];

  const payload = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
  });

  payload.completedAt = new Date();

  const onboarding = await OnboardingProfile.findOneAndUpdate(
    { user: req.user.id },
    payload,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(200).json({
    status: "success",
    data: {
      onboarding,
    },
  });
});
