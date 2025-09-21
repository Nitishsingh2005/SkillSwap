const User = require("../models/User");

class SkillsController {
  // Get all users with filtering
  static async getUsers(req, res) {
    try {
      const {
        search,
        skill,
        category,
        level,
        location,
        videoCallReady,
        offering,
        page = 1,
        limit = 20,
      } = req.query;

      const filter = { _id: { $ne: req.user._id }, isActive: true };

      // Search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
          { "skills.name": { $regex: search, $options: "i" } },
        ];
      }

      // Skill filter
      if (skill) {
        filter["skills.name"] = { $regex: skill, $options: "i" };
      }

      // Category filter
      if (category) {
        filter["skills.category"] = category;
      }

      // Level filter
      if (level) {
        filter["skills.level"] = level;
      }

      // Location filter
      if (location) {
        filter.location = { $regex: location, $options: "i" };
      }

      // Video call filter
      if (videoCallReady !== undefined) {
        filter.videoCallReady = videoCallReady === "true";
      }

      // Offering/Seeking filter
      if (offering !== undefined) {
        filter["skills.offering"] = offering === "true";
      }

      const users = await User.find(filter)
        .select("-password")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(filter);

      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      });
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Add skill to user
  static async addSkill(req, res) {
    try {
      if (req.params.id !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { name, category, level, offering } = req.body;

      // Validate required fields
      if (!name || !category || !level) {
        return res.status(400).json({
          message: "Name, category, and level are required",
        });
      }

      // Validate level
      const validLevels = ["Beginner", "Intermediate", "Expert"];
      if (!validLevels.includes(level)) {
        return res.status(400).json({
          message: "Level must be Beginner, Intermediate, or Expert",
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if skill already exists
      const existingSkill = user.skills.find(
        (skill) =>
          skill.name.toLowerCase() === name.toLowerCase() &&
          skill.offering === (offering !== undefined ? offering : true)
      );

      if (existingSkill) {
        return res.status(400).json({
          message: "You already have this skill with the same offering status",
        });
      }

      const newSkill = {
        name: name.trim(),
        category: category.trim(),
        level,
        offering: offering !== undefined ? offering : true,
      };

      user.skills.push(newSkill);
      await user.save();

      res.json({
        message: "Skill added successfully",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Add skill error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // Update skill
  static async updateSkill(req, res) {
    try {
      if (req.params.id !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { name, category, level, offering } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const skill = user.skills.id(req.params.skillId);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      // Validate level if provided
      if (level) {
        const validLevels = ["Beginner", "Intermediate", "Expert"];
        if (!validLevels.includes(level)) {
          return res.status(400).json({
            message: "Level must be Beginner, Intermediate, or Expert",
          });
        }
      }

      skill.name = name ? name.trim() : skill.name;
      skill.category = category ? category.trim() : skill.category;
      skill.level = level || skill.level;
      skill.offering = offering !== undefined ? offering : skill.offering;

      await user.save();

      res.json({
        message: "Skill updated successfully",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Update skill error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Remove skill
  static async removeSkill(req, res) {
    try {
      if (req.params.id !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const skill = user.skills.id(req.params.skillId);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }

      skill.remove();
      await user.save();

      res.json({
        message: "Skill removed successfully",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Remove skill error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get skill categories with counts
  static async getCategories(req, res) {
    try {
      const categories = await User.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$skills" },
        {
          $group: {
            _id: "$skills.category",
            count: { $sum: 1 },
            offering: { $sum: { $cond: ["$skills.offering", 1, 0] } },
            seeking: { $sum: { $cond: ["$skills.offering", 0, 1] } },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const categoryList = categories.map((cat) => ({
        name: cat._id,
        totalCount: cat.count,
        offeringCount: cat.offering,
        seekingCount: cat.seeking,
      }));

      res.json({ categories: categoryList });
    } catch (error) {
      console.error("Categories fetch error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get popular skills
  static async getPopularSkills(req, res) {
    try {
      const { limit = 10, category } = req.query;

      const matchStage = { $match: { isActive: true } };
      const pipeline = [matchStage, { $unwind: "$skills" }];

      // Add category filter if provided
      if (category) {
        pipeline.push({ $match: { "skills.category": category } });
      }

      pipeline.push(
        {
          $group: {
            _id: {
              name: "$skills.name",
              category: "$skills.category",
            },
            count: { $sum: 1 },
            offering: { $sum: { $cond: ["$skills.offering", 1, 0] } },
            seeking: { $sum: { $cond: ["$skills.offering", 0, 1] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      );

      const popularSkills = await User.aggregate(pipeline);

      const skills = popularSkills.map((skill) => ({
        name: skill._id.name,
        category: skill._id.category,
        totalUsers: skill.count,
        offering: skill.offering,
        seeking: skill.seeking,
      }));

      res.json({ skills });
    } catch (error) {
      console.error("Popular skills fetch error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get skill match suggestions
  static async getMatchSuggestions(req, res) {
    try {
      const targetUserId = req.params.userId;
      const currentUser = await User.findById(req.user._id);
      const targetUser = await User.findById(targetUserId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find skills current user offers that target user seeks
      const currentUserOffering = currentUser.skills.filter(
        (skill) => skill.offering
      );
      const targetUserSeeking = targetUser.skills.filter(
        (skill) => !skill.offering
      );

      // Find skills target user offers that current user seeks
      const targetUserOffering = targetUser.skills.filter(
        (skill) => skill.offering
      );
      const currentUserSeeking = currentUser.skills.filter(
        (skill) => !skill.offering
      );

      const matches = [];

      // Check what current user can teach target user
      currentUserOffering.forEach((skill) => {
        const match = targetUserSeeking.find(
          (seekSkill) =>
            seekSkill.name.toLowerCase() === skill.name.toLowerCase()
        );
        if (match) {
          matches.push({
            type: "you_teach",
            skill: skill.name,
            category: skill.category,
            yourLevel: skill.level,
            theirLevel: match.level,
            compatibility: SkillsController.calculateCompatibility(
              skill.level,
              match.level
            ),
          });
        }
      });

      // Check what target user can teach current user
      targetUserOffering.forEach((skill) => {
        const match = currentUserSeeking.find(
          (seekSkill) =>
            seekSkill.name.toLowerCase() === skill.name.toLowerCase()
        );
        if (match) {
          matches.push({
            type: "they_teach",
            skill: skill.name,
            category: skill.category,
            theirLevel: skill.level,
            yourLevel: match.level,
            compatibility: SkillsController.calculateCompatibility(
              skill.level,
              match.level
            ),
          });
        }
      });

      // Sort by compatibility score
      matches.sort((a, b) => b.compatibility - a.compatibility);

      res.json({
        matches,
        matchCount: matches.length,
        overallCompatibility:
          matches.length > 0
            ? matches.reduce((sum, match) => sum + match.compatibility, 0) /
              matches.length
            : 0,
      });
    } catch (error) {
      console.error("Match suggestions error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get platform statistics
  static async getStats(req, res) {
    try {
      const totalUsers = await User.countDocuments({ isActive: true });

      const skillStats = await User.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$skills" },
        {
          $group: {
            _id: null,
            totalSkills: { $sum: 1 },
            offeringSkills: { $sum: { $cond: ["$skills.offering", 1, 0] } },
            seekingSkills: { $sum: { $cond: ["$skills.offering", 0, 1] } },
            categories: { $addToSet: "$skills.category" },
            skillNames: { $addToSet: "$skills.name" },
          },
        },
      ]);

      const stats = skillStats[0] || {
        totalSkills: 0,
        offeringSkills: 0,
        seekingSkills: 0,
        categories: [],
        skillNames: [],
      };

      res.json({
        totalUsers,
        totalSkills: stats.totalSkills,
        offeringSkills: stats.offeringSkills,
        seekingSkills: stats.seekingSkills,
        uniqueCategories: stats.categories.length,
        uniqueSkills: stats.skillNames.length,
        categories: stats.categories,
        exchangeRatio:
          stats.offeringSkills > 0
            ? (stats.seekingSkills / stats.offeringSkills).toFixed(2)
            : 0,
      });
    } catch (error) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Helper method to calculate skill compatibility
  static calculateCompatibility(teacherLevel, learnerLevel) {
    const levels = { Beginner: 1, Intermediate: 2, Expert: 3 };
    const teacherScore = levels[teacherLevel];
    const learnerScore = levels[learnerLevel];

    // Best compatibility: Expert teaching Beginner/Intermediate
    // Good compatibility: Intermediate teaching Beginner
    // Lower compatibility: Same level or learner higher than teacher

    if (teacherScore > learnerScore) {
      return (teacherScore - learnerScore + 1) * 25; // 50-75 points
    } else if (teacherScore === learnerScore) {
      return 25; // Peer learning - moderate compatibility
    } else {
      return 10; // Lower compatibility
    }
  }
}

module.exports = SkillsController;
