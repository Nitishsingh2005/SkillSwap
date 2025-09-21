const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("./models/User");

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding");

    // Clear existing data (optional - remove this in production)
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create test users with skills
    const testUsers = [
      {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        bio: "Full-stack developer passionate about React and Node.js",
        location: "New York, NY",
        videoCallReady: true,
        skills: [
          {
            name: "React",
            category: "Frontend",
            level: "Expert",
            offering: true,
          },
          {
            name: "Node.js",
            category: "Backend",
            level: "Expert",
            offering: true,
          },
          {
            name: "Python",
            category: "Backend",
            level: "Beginner",
            offering: false,
          },
          {
            name: "Machine Learning",
            category: "Data Science",
            level: "Beginner",
            offering: false,
          },
        ],
        availability: [
          { day: "Monday", timeSlots: ["10:00-12:00", "14:00-16:00"] },
          { day: "Wednesday", timeSlots: ["09:00-11:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/johndoe" },
          { platform: "Portfolio", url: "https://johndoe.dev" },
        ],
      },
      {
        name: "Sarah Wilson",
        email: "sarah@example.com",
        password: "password123",
        bio: "UX/UI Designer with expertise in Figma and user research",
        location: "San Francisco, CA",
        videoCallReady: true,
        skills: [
          {
            name: "Figma",
            category: "Design",
            level: "Expert",
            offering: true,
          },
          {
            name: "Adobe XD",
            category: "Design",
            level: "Expert",
            offering: true,
          },
          {
            name: "User Research",
            category: "Design",
            level: "Intermediate",
            offering: true,
          },
          {
            name: "React",
            category: "Frontend",
            level: "Beginner",
            offering: false,
          },
        ],
        availability: [
          { day: "Tuesday", timeSlots: ["11:00-13:00", "16:00-18:00"] },
          { day: "Thursday", timeSlots: ["10:00-12:00", "14:00-16:00"] },
        ],
        portfolioLinks: [
          { platform: "Behance", url: "https://behance.net/sarahwilson" },
          { platform: "Dribbble", url: "https://dribbble.com/sarahwilson" },
        ],
      },
      {
        name: "Mike Chen",
        email: "mike@example.com",
        password: "password123",
        bio: "Data scientist specializing in machine learning and Python",
        location: "Austin, TX",
        videoCallReady: false,
        skills: [
          {
            name: "Python",
            category: "Backend",
            level: "Expert",
            offering: true,
          },
          {
            name: "Machine Learning",
            category: "Data Science",
            level: "Expert",
            offering: true,
          },
          {
            name: "TensorFlow",
            category: "Data Science",
            level: "Intermediate",
            offering: true,
          },
          {
            name: "JavaScript",
            category: "Frontend",
            level: "Beginner",
            offering: false,
          },
          {
            name: "React",
            category: "Frontend",
            level: "Beginner",
            offering: false,
          },
        ],
        availability: [
          { day: "Monday", timeSlots: ["13:00-15:00", "17:00-19:00"] },
          { day: "Friday", timeSlots: ["10:00-12:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/mikechen" },
          { platform: "Kaggle", url: "https://kaggle.com/mikechen" },
        ],
      },
      {
        name: "Emma Rodriguez",
        email: "emma@example.com",
        password: "password123",
        bio: "DevOps engineer with expertise in AWS and Docker",
        location: "Seattle, WA",
        videoCallReady: true,
        skills: [
          {
            name: "Docker",
            category: "DevOps",
            level: "Expert",
            offering: true,
          },
          {
            name: "Kubernetes",
            category: "DevOps",
            level: "Intermediate",
            offering: true,
          },
          { name: "AWS", category: "DevOps", level: "Expert", offering: true },
          {
            name: "Python",
            category: "Backend",
            level: "Intermediate",
            offering: false,
          },
        ],
        availability: [
          { day: "Wednesday", timeSlots: ["12:00-14:00", "16:00-18:00"] },
          { day: "Saturday", timeSlots: ["09:00-11:00", "14:00-16:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/emmarodriguez" },
          {
            platform: "LinkedIn",
            url: "https://linkedin.com/in/emmarodriguez",
          },
        ],
      },
      {
        name: "Alex Kim",
        email: "alex@example.com",
        password: "password123",
        bio: "Mobile app developer focused on React Native and Flutter",
        location: "Los Angeles, CA",
        videoCallReady: true,
        skills: [
          {
            name: "React Native",
            category: "Mobile",
            level: "Expert",
            offering: true,
          },
          {
            name: "Flutter",
            category: "Mobile",
            level: "Intermediate",
            offering: true,
          },
          {
            name: "JavaScript",
            category: "Frontend",
            level: "Expert",
            offering: true,
          },
          {
            name: "Swift",
            category: "Mobile",
            level: "Beginner",
            offering: false,
          },
          {
            name: "Kotlin",
            category: "Mobile",
            level: "Beginner",
            offering: false,
          },
        ],
        availability: [
          { day: "Tuesday", timeSlots: ["09:00-11:00", "13:00-15:00"] },
          { day: "Thursday", timeSlots: ["11:00-13:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/alexkim" },
          { platform: "Portfolio", url: "https://alexkim.dev" },
        ],
      },
    ];

    // Create users
    const createdUsers = [];
    for (const userData of testUsers) {
      try {
        const user = new User(userData);
        const savedUser = await user.save();
        createdUsers.push(savedUser);
        console.log(`✅ Created user: ${savedUser.name} (${savedUser.email})`);
      } catch (error) {
        console.error(
          `❌ Error creating user ${userData.name}:`,
          error.message
        );
      }
    }

    console.log(
      `\n🎉 Successfully created ${createdUsers.length} users with skills!`
    );

    // Display some statistics
    const totalSkills = createdUsers.reduce(
      (total, user) => total + user.skills.length,
      0
    );
    const offeringSkills = createdUsers.reduce(
      (total, user) =>
        total + user.skills.filter((skill) => skill.offering).length,
      0
    );
    const seekingSkills = createdUsers.reduce(
      (total, user) =>
        total + user.skills.filter((skill) => !skill.offering).length,
      0
    );

    console.log("\n📊 Database Statistics:");
    console.log(`Total Users: ${createdUsers.length}`);
    console.log(`Total Skills: ${totalSkills}`);
    console.log(`Skills Being Offered: ${offeringSkills}`);
    console.log(`Skills Being Sought: ${seekingSkills}`);

    // Test database queries
    console.log("\n🔍 Testing Database Queries:");

    // Find users offering React
    const reactTeachers = await User.find({
      "skills.name": "React",
      "skills.offering": true,
    }).select("name email skills");
    console.log(`Users offering React: ${reactTeachers.length}`);

    // Find users seeking Python
    const pythonLearners = await User.find({
      "skills.name": "Python",
      "skills.offering": false,
    }).select("name email skills");
    console.log(`Users seeking Python: ${pythonLearners.length}`);

    // Category breakdown
    const categoryStats = await User.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    console.log("\nSkills by Category:");
    categoryStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} skills`);
    });

    console.log("\n✅ Database seeding completed successfully!");
    console.log("🚀 You can now test the API endpoints");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seed function
if (require.main === module) {
  seedData();
}

module.exports = seedData;
