const express = require("express");
const SkillsController = require("../controllers/skillsController");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const {
  validateSkill,
  validateSkillFilters,
  rateLimitSkills,
} = require("../middleware/skillValidation");
const router = express.Router();

// @route   GET /api/skills/users
// @desc    Get all users with filtering
router.get("/users", optionalAuth, validateSkillFilters, SkillsController.getUsers);

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


// @route   GET /api/skills/categories
// @desc    Get all skill categories with counts
router.get("/categories", SkillsController.getCategories);

// @route   GET /api/skills/popular
// @desc    Get popular skills
router.get("/popular", SkillsController.getPopularSkills);

// @route   GET /api/skills/matches
// @desc    Find skill matches for current user
router.get("/matches", auth, SkillsController.findSkillMatches);

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
