const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");
const { sendVerificationEmail } = require("../services/emailService");
const router = express.Router();

// Rate limiter: 15 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for resend: 3 per hour
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many resend requests. Please wait an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/auth/register
// @desc    Register user — sends verification email, does NOT log in yet
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate a secure verification token (expires in 24h)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      name,
      email,
      password,
      skills: [],
      availability: [],
      portfolioLinks: [],
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await user.save();

    // Send verification email (non-blocking — don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailErr) {
      console.error("Warning: verification email failed to send:", emailErr.message);
    }

    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      requiresVerification: true,
      email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address using the token from the email link
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This verification link has already been used or has expired.",
        alreadyUsed: true,
      });
    }


    // Mark as verified and clear the token
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Issue auth tokens so the user is logged in immediately after verification
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Email verified successfully! Welcome to SkillSwap.",
      accessToken,
      refreshToken,
      token: accessToken, // legacy alias
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend the verification email
router.post("/resend-verification", resendLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Don't reveal if the email exists or not (security)
    if (!user || user.isEmailVerified) {
      return res.json({
        message: "If that account exists and is unverified, a new email has been sent.",
      });
    }

    // Generate a fresh token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(email, user.name, verificationToken);
    } catch (emailErr) {
      console.error("Warning: resend email failed:", emailErr.message);
    }

    res.json({
      message: "If that account exists and is unverified, a new email has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Login user — blocked if email not verified
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Block login if email not verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      token: accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Exchange a valid refreshToken for a new accessToken
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken, token: accessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get("/profile", auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
});

// @route   POST /api/auth/upload-avatar
// @desc    Upload profile picture
router.post("/upload-avatar", auth, uploadAvatar, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let avatarCleanupWarning = false;
    if (user.avatar && !user.avatar.startsWith("http")) {
      const oldAvatarPath = path.join(
        __dirname,
        "../uploads/avatars",
        path.basename(user.avatar)
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlink(oldAvatarPath, (err) => {
          if (err) {
            console.warn("Warning: could not delete old avatar:", err.message);
            avatarCleanupWarning = true;
          }
        });
      }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      message: "Profile picture updated successfully",
      user: user.toJSON(),
      ...(avatarCleanupWarning && { warning: "Old avatar file could not be removed from disk." }),
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error cleaning up file:", err);
      });
    }
    res.status(500).json({ message: "Server error during avatar upload" });
  }
});

// @route   DELETE /api/auth/remove-avatar
// @desc    Remove profile picture
router.delete("/remove-avatar", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.avatar) {
      return res.status(400).json({ message: "No profile picture to remove" });
    }

    if (!user.avatar.startsWith("http")) {
      const oldAvatarPath = path.join(
        __dirname,
        "../uploads/avatars",
        path.basename(user.avatar)
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlink(oldAvatarPath, (err) => {
          if (err) console.warn("Warning: could not delete avatar file:", err.message);
        });
      }
    }

    user.avatar = "";
    await user.save();

    res.json({
      message: "Profile picture removed successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Avatar removal error:", error);
    res.status(500).json({ message: "Server error during avatar removal" });
  }
});

// @route   POST /api/auth/portfolio-links
// @desc    Add portfolio link
router.post("/portfolio-links", auth, async (req, res) => {
  try {
    const { platform, url } = req.body;
    if (!platform || !url) {
      return res.status(400).json({ message: "Platform and URL are required" });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.portfolioLinks.push({ platform, url });
    await user.save();
    res.json({ message: "Portfolio link added successfully", user: user.toJSON() });
  } catch (error) {
    console.error("Add portfolio link error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/auth/portfolio-links/:linkId
// @desc    Remove portfolio link
router.delete("/portfolio-links/:linkId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const link = user.portfolioLinks.id(req.params.linkId);
    if (!link) return res.status(404).json({ message: "Portfolio link not found" });
    link.remove();
    await user.save();
    res.json({ message: "Portfolio link removed successfully", user: user.toJSON() });
  } catch (error) {
    console.error("Remove portfolio link error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/availability
// @desc    Add availability slot
router.post("/availability", auth, async (req, res) => {
  try {
    const { day, timeSlots } = req.body;
    if (!day || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "Day and timeSlots array are required" });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const existingDay = user.availability.find((slot) => slot.day === day);
    if (existingDay) {
      existingDay.timeSlots = timeSlots;
    } else {
      user.availability.push({ day, timeSlots });
    }
    await user.save();
    res.json({ message: "Availability updated successfully", user: user.toJSON() });
  } catch (error) {
    console.error("Add availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/auth/availability/:slotId
// @desc    Remove availability slot
router.delete("/availability/:slotId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const slot = user.availability.id(req.params.slotId);
    if (!slot) return res.status(404).json({ message: "Availability slot not found" });
    slot.remove();
    await user.save();
    res.json({ message: "Availability slot removed successfully", user: user.toJSON() });
  } catch (error) {
    console.error("Remove availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
router.post("/logout", auth, (req, res) => {
  res.json({ message: "Logout successful" });
});

module.exports = router;
