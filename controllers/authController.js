const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Email = require("../utils/sendEmail");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const crypto = require("crypto");

// Helper function to sign token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });
};

// Helper function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

//Register
exports.register = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    username,
    password,
    passwordConfirm,
    email,
    dateOfBirth,
    height,
    weight,
  } = req.body;

  const newUser = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    passwordConfirm,
    photo: req.file ? req.file.filename : null,
    dateOfBirth,
    height,
    weight,
  });

  const url = `${req.protocol}://${req.get("host")}/api/v1/users/verify/${newUser.verifyToken}`;

  await new Email(newUser, url)
    .sendVerificationEmail()
    .then(() => {
      console.log("Verification email sent successfully");
    })
    .catch((err) => {
      console.error("Error sending verification email:", err);
    });

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});

//Login
exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: "fail",
      msg: "Please provide username and password",
    });
  }

  const user = await User.findOne({ username }).select("+password");

  if (!user)
    return res.status(400).json({
      status: "fail",
      msg: "user not found",
    });

  if (!user.isVerified) {
    return res.status(400).json({
      status: "fail",
      msg: "please verify email first",
    });
  }

  if (!(await user.correctPassword(password, user.password)))
    return res.status(400).json({
      status: "fail",
      msg: "invalid password",
    });

  createSendToken(user, 200, res);
});

// logout
exports.logout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({
    status: "success",
    msg: "Logged out successfully",
  });
};

//verify email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  console.log("Verification request received for token:", token);

  const user = await User.findOneAndUpdate(
    { verifyToken: token },
    { isVerified: true, verifyToken: null },
    { returnDocument: "after" },
  );

  if (!user) {
    console.log("No user found for token:", token);
    return next(new AppError("Invalid or expired token", 400));
  }

  console.log("User verified successfully:", user.email);

  // Redirect to frontend success page
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontendUrl}/verify-success`);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide your email address", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("There is no user with that email address", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetURL = `${frontendUrl}/reset-token/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: "success",
      msg: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500,
    );
  }
});

exports.exchangeResetToken = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError("Reset token is required", 400));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // Set HttpOnly cookie with the token
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("resetToken", token, cookieOptions);

  res.status(200).json({
    status: "success",
    message: "Reset token exchanged successfully",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const token = req.cookies.resetToken;
  const { password, passwordConfirm } = req.body;

  if (!token) {
    return next(new AppError("Reset token is required", 400));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Clear the reset token cookie
  res.cookie("resetToken", "", {
    expires: new Date(Date.now() - 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;
  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  const ok = await user.correctPassword(currentPassword, user.password);
  if (!ok) return next(new AppError("Current password is incorrect", 401));
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  createSendToken(user, 200, res);
});
