const validateSkill = (req, res, next) => {
  const { name, category, level, offering } = req.body;

  // Validate required fields for POST requests
  if (req.method === "POST") {
    if (!name || !category || !level) {
      return res.status(400).json({
        message: "Name, category, and level are required",
        errors: {
          name: !name ? "Name is required" : null,
          category: !category ? "Category is required" : null,
          level: !level ? "Level is required" : null,
        },
      });
    }
  }

  // Validate skill name
  if (name && (typeof name !== "string" || name.trim().length < 2)) {
    return res.status(400).json({
      message: "Skill name must be at least 2 characters long",
    });
  }

  // Validate category
  const validCategories = [
    "Frontend",
    "Backend",
    "Design",
    "Data Science",
    "Mobile",
    "DevOps",
    "Marketing",
    "Other",
  ];

  if (category && !validCategories.includes(category)) {
    return res.status(400).json({
      message: "Invalid category",
      validCategories,
    });
  }

  // Validate level
  const validLevels = ["Beginner", "Intermediate", "Expert"];
  if (level && !validLevels.includes(level)) {
    return res.status(400).json({
      message: "Invalid level",
      validLevels,
    });
  }

  // Validate offering (if provided)
  if (offering !== undefined && typeof offering !== "boolean") {
    return res.status(400).json({
      message: "Offering must be a boolean value",
    });
  }

  // Sanitize data
  if (name) req.body.name = name.trim();
  if (category) req.body.category = category.trim();

  next();
};

const validateSkillFilters = (req, res, next) => {
  const { category, level, videoCallReady, offering, page, limit } = req.query;

  // Validate category filter
  if (category) {
    const validCategories = [
      "Frontend",
      "Backend",
      "Design",
      "Data Science",
      "Mobile",
      "DevOps",
      "Marketing",
      "Other",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category filter",
        validCategories,
      });
    }
  }

  // Validate level filter
  if (level) {
    const validLevels = ["Beginner", "Intermediate", "Expert"];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        message: "Invalid level filter",
        validLevels,
      });
    }
  }

  // Validate boolean filters
  if (videoCallReady && !["true", "false"].includes(videoCallReady)) {
    return res.status(400).json({
      message: "videoCallReady must be true or false",
    });
  }

  if (offering && !["true", "false"].includes(offering)) {
    return res.status(400).json({
      message: "offering must be true or false",
    });
  }

  // Validate pagination
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      message: "Page must be a positive number",
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      message: "Limit must be between 1 and 100",
    });
  }

  next();
};

const rateLimitSkills = (req, res, next) => {
  // Simple rate limiting - can be enhanced with Redis
  const userId = req.user._id.toString();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 50; // Max 50 skill operations per 15 minutes

  // Initialize global rate limit store if it doesn't exist
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  req.rateLimitStore = global.rateLimitStore;

  const userRequests = req.rateLimitStore.get(userId) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > userRequests.resetTime) {
    userRequests.count = 1;
    userRequests.resetTime = now + windowMs;
  } else {
    userRequests.count++;
  }

  req.rateLimitStore.set(userId, userRequests);

  if (userRequests.count > maxRequests) {
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
    });
  }

  next();
};

module.exports = {
  validateSkill,
  validateSkillFilters,
  rateLimitSkills,
};
