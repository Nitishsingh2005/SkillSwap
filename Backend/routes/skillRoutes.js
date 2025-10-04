const express = require("express");
const SkillsController = require("../controllers/skillsController");
const auth = require("../middleware/auth");
const {
  validateSkill,
  validateSkillFilters,
  rateLimitSkills,
} = require("../middleware/skillValidation");
const router = express.Router();

// @route   GET /api/skills/users
// @desc    Get all users with filtering
router.get("/users", auth, validateSkillFilters, SkillsController.getUsers);

// @route   GET /api/skills/users/:id
// @desc    Get specific user profile
router.get("/users/:id", auth, SkillsController.getUserById);

// @route   POST /api/skills/users/:id/skills
// @desc    Add skill to user
router.post(
  "/users/:id/skills",
  auth,
  validateSkill,
  SkillsController.addSkill
);

// @route   PUT /api/skills/users/:id/skills/:skillId
// @desc    Update skill
router.put(
  "/users/:id/skills/:skillId",
  auth,
  validateSkill,
  SkillsController.updateSkill
);

// @route   DELETE /api/skills/users/:id/skills/:skillId
// @desc    Remove skill
router.delete("/users/:id/skills/:skillId", auth, SkillsController.removeSkill);

// @route   POST /api/skills/debug-add/:id
// @desc    Debug version of add skill (temporary)
router.post("/debug-add/:id", auth, async (req, res) => {
  try {
    console.log("🐛 DEBUG: Request received");
    console.log("🐛 DEBUG: User ID from params:", req.params.id);
    console.log("🐛 DEBUG: Authenticated user ID:", req.user._id.toString());
    console.log("🐛 DEBUG: Request body:", req.body);
    console.log("🐛 DEBUG: Headers:", req.headers);

    const User = require("../models/User");
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, category, level, offering } = req.body;

    const newSkill = {
      name: name || "Test Skill",
      category: category || "Other",
      level: level || "Beginner",
      offering: offering !== undefined ? offering : true,
    };

    console.log("🐛 DEBUG: Adding skill:", newSkill);

    user.skills.push(newSkill);
    await user.save();

    console.log("🐛 DEBUG: Skill added! Total skills:", user.skills.length);

    res.json({
      message: "Debug: Skill added successfully",
      user: user.toJSON(),
      debug: {
        skillsCount: user.skills.length,
        lastSkill: user.skills[user.skills.length - 1],
      },
    });
  } catch (error) {
    console.error("🐛 DEBUG: Error:", error);
    res.status(500).json({ message: "Debug error", error: error.message });
  }
});

// @route   GET /api/skills/categories
// @desc    Get all skill categories with counts
router.get("/categories", SkillsController.getCategories);

// @route   GET /api/skills/popular
// @desc    Get popular skills
router.get("/popular", SkillsController.getPopularSkills);

// @route   GET /api/skills/match-suggestions/:userId
// @desc    Get skill match suggestions for a user
router.get(
  "/match-suggestions/:userId",
  auth,
  SkillsController.getMatchSuggestions
);

// @route   GET /api/skills/stats
// @desc    Get platform skill statistics
router.get("/stats", SkillsController.getStats);

module.exports = router;
