const express = require("express");
const upload = require("../utils/upload");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

// Register + upload photo
router.post("/register", upload.single("photo"), authController.register);

// Login
router.post("/login", authController.login);

router.get("/verify/:token", authController.verifyEmail);

//Delete
router.delete("/delete-account", userController.deleteAccount);

// Password reset
router.post("/forgot-password", authController.forgotPassword);
router.post("/exchange-reset-token", authController.exchangeResetToken);
router.patch("/reset-password", authController.resetPassword);

//Update account
router.patch(
  "/update-account",
  authController.protect,
  upload.single("photo"),
  userController.updateAccount,
);

// Update password
router.patch(
  "/update-password",
  authController.protect,
  authController.updatePassword,
);

// Get current user
router.get(
  "/me",
  authController.protect,
  userController.getMe,
  userController.getUser,
);
module.exports = router;
