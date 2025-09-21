const User = require("../models/User");

class SkillsService {
  static get VALID_CATEGORIES() {
    return [
      "Frontend",
      "Backend",
      "Design",
      "Data Science",
      "Mobile",
      "DevOps",
      "Marketing",
      "Other",
    ];
  }

  static get VALID_LEVELS() {
    return ["Beginner", "Intermediate", "Expert"];
  }

  /**
   * Find users with complementary skills for potential matches
   */
  static async findSkillMatches(userId, options = {}) {
    const { limit = 10, category, minCompatibility = 20 } = options;

    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      const userOfferingSkills = user.skills.filter((skill) => skill.offering);
      const userSeekingSkills = user.skills.filter((skill) => !skill.offering);

      if (userOfferingSkills.length === 0 && userSeekingSkills.length === 0) {
        return [];
      }

      // Build match pipeline
      const pipeline = [
        {
          $match: {
            _id: { $ne: userId },
            isActive: true,
            ...(category && { "skills.category": category }),
          },
        },
        {
          $addFields: {
            matchScore: {
              $let: {
                vars: {
                  userOffering: userOfferingSkills.map((s) => ({
                    name: s.name.toLowerCase(),
                    level: s.level,
                  })),
                  userSeeking: userSeekingSkills.map((s) => ({
                    name: s.name.toLowerCase(),
                    level: s.level,
                  })),
                },
                in: {
                  $add: [
                    // Score for skills they can teach user
                    {
                      $size: {
                        $filter: {
                          input: "$skills",
                          cond: {
                            $and: [
                              { $eq: ["$$this.offering", true] },
                              {
                                $in: [
                                  { $toLower: "$$this.name" },
                                  "$$userSeeking.name",
                                ],
                              },
                            ],
                          },
                        },
                      },
                    },
                    // Score for skills user can teach them
                    {
                      $size: {
                        $filter: {
                          input: "$skills",
                          cond: {
                            $and: [
                              { $eq: ["$$this.offering", false] },
                              {
                                $in: [
                                  { $toLower: "$$this.name" },
                                  "$$userOffering.name",
                                ],
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $match: { matchScore: { $gte: 1 } } },
        { $sort: { matchScore: -1, rating: -1 } },
        { $limit: limit },
        { $project: { password: 0 } },
      ];

      const matches = await User.aggregate(pipeline);

      // Calculate detailed compatibility for each match
      const detailedMatches = matches
        .map((match) => {
          const compatibility = this.calculateDetailedCompatibility(
            user,
            match
          );
          return {
            user: match,
            compatibility,
            matchScore: match.matchScore,
          };
        })
        .filter(
          (match) => match.compatibility.overallScore >= minCompatibility
        );

      return detailedMatches.sort(
        (a, b) => b.compatibility.overallScore - a.compatibility.overallScore
      );
    } catch (error) {
      console.error("Find skill matches error:", error);
      throw error;
    }
  }

  /**
   * Calculate detailed compatibility between two users
   */
  static calculateDetailedCompatibility(user1, user2) {
    const user1Offering = user1.skills.filter((s) => s.offering);
    const user1Seeking = user1.skills.filter((s) => !s.offering);
    const user2Offering = user2.skills.filter((s) => s.offering);
    const user2Seeking = user2.skills.filter((s) => !s.offering);

    const matches = [];
    let totalScore = 0;

    // User1 can teach User2
    user1Offering.forEach((skill) => {
      const match = user2Seeking.find(
        (s) => s.name.toLowerCase() === skill.name.toLowerCase()
      );
      if (match) {
        const score = this.getCompatibilityScore(skill.level, match.level);
        matches.push({
          type: "user1_teaches",
          skill: skill.name,
          category: skill.category,
          teacherLevel: skill.level,
          learnerLevel: match.level,
          score,
        });
        totalScore += score;
      }
    });

    // User2 can teach User1
    user2Offering.forEach((skill) => {
      const match = user1Seeking.find(
        (s) => s.name.toLowerCase() === skill.name.toLowerCase()
      );
      if (match) {
        const score = this.getCompatibilityScore(skill.level, match.level);
        matches.push({
          type: "user2_teaches",
          skill: skill.name,
          category: skill.category,
          teacherLevel: skill.level,
          learnerLevel: match.level,
          score,
        });
        totalScore += score;
      }
    });

    return {
      matches,
      overallScore:
        matches.length > 0 ? Math.round(totalScore / matches.length) : 0,
      mutualBenefit:
        matches.some((m) => m.type === "user1_teaches") &&
        matches.some((m) => m.type === "user2_teaches"),
      totalMatches: matches.length,
    };
  }

  /**
   * Get compatibility score between teacher and learner levels
   */
  static getCompatibilityScore(teacherLevel, learnerLevel) {
    const levels = { Beginner: 1, Intermediate: 2, Expert: 3 };
    const teacherScore = levels[teacherLevel];
    const learnerScore = levels[learnerLevel];

    if (teacherScore > learnerScore) {
      // Ideal teaching scenario
      return (teacherScore - learnerScore + 1) * 30;
    } else if (teacherScore === learnerScore) {
      // Peer learning
      return 40;
    } else {
      // Less ideal but still possible
      return 20;
    }
  }

  /**
   * Get skill recommendations based on user's current skills and platform trends
   */
  static async getSkillRecommendations(userId, options = {}) {
    const { limit = 5, category } = options;

    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      const userSkillNames = user.skills.map((s) => s.name.toLowerCase());
      const userCategories = [...new Set(user.skills.map((s) => s.category))];

      // Find complementary skills in user's categories
      const pipeline = [
        {
          $match: {
            _id: { $ne: userId },
            isActive: true,
            ...(category && { "skills.category": category }),
          },
        },
        { $unwind: "$skills" },
        {
          $match: {
            "skills.category": { $in: userCategories },
            $expr: {
              $not: {
                $in: [{ $toLower: "$skills.name" }, userSkillNames],
              },
            },
          },
        },
        {
          $group: {
            _id: {
              name: "$skills.name",
              category: "$skills.category",
            },
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
            offering: { $sum: { $cond: ["$skills.offering", 1, 0] } },
          },
        },
        {
          $addFields: {
            recommendationScore: {
              $add: [
                { $multiply: ["$count", 0.4] },
                { $multiply: ["$avgRating", 10] },
                { $multiply: ["$offering", 0.3] },
              ],
            },
          },
        },
        { $sort: { recommendationScore: -1 } },
        { $limit: limit },
      ];

      const recommendations = await User.aggregate(pipeline);

      return recommendations.map((rec) => ({
        name: rec._id.name,
        category: rec._id.category,
        popularity: rec.count,
        avgUserRating: rec.avgRating || 0,
        availableTeachers: rec.offering,
        recommendationScore: Math.round(rec.recommendationScore),
      }));
    } catch (error) {
      console.error("Get skill recommendations error:", error);
      throw error;
    }
  }

  /**
   * Analyze skill gaps in a category
   */
  static async analyzeSkillGaps(category) {
    try {
      const pipeline = [
        { $match: { isActive: true } },
        { $unwind: "$skills" },
        { $match: { "skills.category": category } },
        {
          $group: {
            _id: "$skills.name",
            offering: { $sum: { $cond: ["$skills.offering", 1, 0] } },
            seeking: { $sum: { $cond: ["$skills.offering", 0, 1] } },
            total: { $sum: 1 },
          },
        },
        {
          $addFields: {
            gap: { $subtract: ["$seeking", "$offering"] },
            ratio: {
              $cond: {
                if: { $gt: ["$offering", 0] },
                then: { $divide: ["$seeking", "$offering"] },
                else: "$seeking",
              },
            },
          },
        },
        { $sort: { gap: -1 } },
      ];

      const gaps = await User.aggregate(pipeline);

      return {
        category,
        highDemandSkills: gaps.filter((g) => g.gap > 0).slice(0, 10),
        oversuppliedSkills: gaps.filter((g) => g.gap < 0).slice(0, 5),
        balancedSkills: gaps.filter((g) => g.gap === 0).slice(0, 5),
      };
    } catch (error) {
      console.error("Analyze skill gaps error:", error);
      throw error;
    }
  }

  /**
   * Get skill learning path suggestions
   */
  static getSkillLearningPath(
    currentSkills,
    targetSkill,
    targetLevel = "Expert"
  ) {
    // This is a simplified version - in a real app, you'd have a more sophisticated algorithm
    const skillProgressions = {
      React: ["HTML", "CSS", "JavaScript", "React"],
      "Node.js": ["JavaScript", "Node.js"],
      "Machine Learning": ["Python", "Statistics", "Machine Learning"],
      DevOps: ["Linux", "Docker", "Kubernetes", "CI/CD"],
      // Add more progressions as needed
    };

    const path = skillProgressions[targetSkill] || [targetSkill];
    const currentSkillNames = currentSkills.map((s) => s.name);

    const missingSkills = path.filter(
      (skill) => !currentSkillNames.includes(skill)
    );

    return {
      targetSkill,
      targetLevel,
      fullPath: path,
      completedSteps: path.filter((skill) => currentSkillNames.includes(skill)),
      nextSteps: missingSkills.slice(0, 3),
      estimatedTimeMonths: missingSkills.length * 2, // 2 months per skill
    };
  }
}

module.exports = SkillsService;
