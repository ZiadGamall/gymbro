const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const path = require("path");
const factory = require("./handlerFactory");

// Helper function to filter allowed fields for update
const filterObj = (obj) => {
  const allowedFields = [
    "username",
    "email",
    "firstName",
    "lastName",
    "height",
    "weight",
    "dateOfBirth",
    "gender",
  ];
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//Update account
exports.updateAccount = catchAsync(async (req, res, next) => {
  const { currentPassword } = req.body;
  if (!currentPassword)
    return next(new AppError("Current password is required", 400));

  // 1) Get user + password (for verification)
  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  // 2) Verify current password
  const ok = await user.correctPassword(currentPassword, user.password);
  if (!ok) return next(new AppError("Current password is incorrect", 401));

  // 3) Prepare update data (allowlist)
  const updates = filterObj(req.body);

  // 4) Handle photo update + delete old one
  if (req.file) {
    const oldPhoto = user.photo;
    updates.photo = req.file.filename;

    if (oldPhoto) {
      const oldImagePath = path.join(__dirname, "../uploads", oldPhoto);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
  }

  // 5) Apply updates and save (runs validators)
  Object.assign(user, updates);
  await user.save({ validateModifiedOnly: true });

  // 6) Response (no password)
  const updatedUser = {
    username: user.username,
    email: user.email,
    photo: user.photo,
    isVerified: user.isVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    height: user.height,
    weight: user.weight,
    dateOfBirth: user.dateOfBirth,
  };

  res.status(200).json({
    status: "success",
    data: {
      message: "Account updated successfully",
      user: updatedUser,
    },
  });
});

//delete account
exports.deleteAccount = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid password", 400));
  }

  if (user.photo) {
    const imagePath = path.join(__dirname, "../uploads", user.photo);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log("photo deleted", user.photo);
    }
  }

  await User.findOneAndDelete({ email });

  res.status(200).json({
    status: "success",
    data: {
      message: "Account deleted successfully",
      deletedUser: user.username,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);
