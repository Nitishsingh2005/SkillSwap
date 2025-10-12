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

    // Create realistic test users with complementary skills for better matching
    const testUsers = [
      {
        name: "Alex Thompson",
        email: "alex@example.com",
        password: "password123",
        bio: "Senior React developer with 5+ years experience. Love teaching frontend development and learning new backend technologies.",
        location: "San Francisco, CA",
        videoCallReady: true,
        rating: 4.8,
        reviewCount: 32,
        skills: [
          { name: "React", category: "Frontend", level: "Expert", offering: true },
          { name: "JavaScript", category: "Frontend", level: "Expert", offering: true },
          { name: "TypeScript", category: "Frontend", level: "Expert", offering: true },
          { name: "Python", category: "Backend", level: "Beginner", offering: false },
          { name: "Machine Learning", category: "Data Science", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Monday", timeSlots: ["10:00-12:00", "14:00-16:00"] },
          { day: "Wednesday", timeSlots: ["09:00-11:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/alexthompson" },
          { platform: "Portfolio", url: "https://alexthompson.dev" },
        ],
      },
      {
        name: "Sarah Chen",
        email: "sarah@example.com",
        password: "password123",
        bio: "Data scientist and Python expert. Passionate about teaching machine learning and learning frontend development.",
        location: "New York, NY",
        videoCallReady: true,
        rating: 4.9,
        reviewCount: 28,
        skills: [
          { name: "Python", category: "Backend", level: "Expert", offering: true },
          { name: "Machine Learning", category: "Data Science", level: "Expert", offering: true },
          { name: "TensorFlow", category: "Data Science", level: "Expert", offering: true },
          { name: "React", category: "Frontend", level: "Beginner", offering: false },
          { name: "JavaScript", category: "Frontend", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Tuesday", timeSlots: ["11:00-13:00", "16:00-18:00"] },
          { day: "Thursday", timeSlots: ["10:00-12:00", "14:00-16:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/sarahchen" },
          { platform: "Kaggle", url: "https://kaggle.com/sarahchen" },
        ],
      },
      {
        name: "Mike Rodriguez",
        email: "mike@example.com",
        password: "password123",
        bio: "Full-stack developer specializing in Node.js and Express. Looking to learn design principles and improve my UI/UX skills.",
        location: "Austin, TX",
        videoCallReady: true,
        rating: 4.7,
        reviewCount: 24,
        skills: [
          { name: "Node.js", category: "Backend", level: "Expert", offering: true },
          { name: "Express.js", category: "Backend", level: "Expert", offering: true },
          { name: "MongoDB", category: "Backend", level: "Expert", offering: true },
          { name: "Figma", category: "Design", level: "Beginner", offering: false },
          { name: "UI/UX Design", category: "Design", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Monday", timeSlots: ["13:00-15:00", "17:00-19:00"] },
          { day: "Friday", timeSlots: ["10:00-12:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/mikerodriguez" },
          { platform: "Portfolio", url: "https://mikerodriguez.dev" },
        ],
      },
      {
        name: "Emma Wilson",
        email: "emma@example.com",
        password: "password123",
        bio: "UX/UI Designer with expertise in Figma and user research. Want to learn React to build my own prototypes.",
        location: "Seattle, WA",
        videoCallReady: true,
        rating: 4.8,
        reviewCount: 31,
        skills: [
          { name: "Figma", category: "Design", level: "Expert", offering: true },
          { name: "Adobe XD", category: "Design", level: "Expert", offering: true },
          { name: "User Research", category: "Design", level: "Expert", offering: true },
          { name: "React", category: "Frontend", level: "Beginner", offering: false },
          { name: "JavaScript", category: "Frontend", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Wednesday", timeSlots: ["12:00-14:00", "16:00-18:00"] },
          { day: "Saturday", timeSlots: ["09:00-11:00", "14:00-16:00"] },
        ],
        portfolioLinks: [
          { platform: "Behance", url: "https://behance.net/emmawilson" },
          { platform: "Dribbble", url: "https://dribbble.com/emmawilson" },
        ],
      },
      {
        name: "David Kim",
        email: "david@example.com",
        password: "password123",
        bio: "DevOps engineer with expertise in AWS and Docker. Looking to learn Python for automation and data analysis.",
        location: "Los Angeles, CA",
        videoCallReady: true,
        rating: 4.6,
        reviewCount: 19,
        skills: [
          { name: "Docker", category: "DevOps", level: "Expert", offering: true },
          { name: "Kubernetes", category: "DevOps", level: "Expert", offering: true },
          { name: "AWS", category: "DevOps", level: "Expert", offering: true },
          { name: "Python", category: "Backend", level: "Beginner", offering: false },
          { name: "Machine Learning", category: "Data Science", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Tuesday", timeSlots: ["09:00-11:00", "13:00-15:00"] },
          { day: "Thursday", timeSlots: ["11:00-13:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/davidkim" },
          { platform: "LinkedIn", url: "https://linkedin.com/in/davidkim" },
        ],
      },
      {
        name: "Lisa Johnson",
        email: "lisa@example.com",
        password: "password123",
        bio: "Mobile app developer focused on React Native and Flutter. Want to learn backend development to create full-stack apps.",
        location: "Chicago, IL",
        videoCallReady: true,
        rating: 4.9,
        reviewCount: 35,
        skills: [
          { name: "React Native", category: "Mobile", level: "Expert", offering: true },
          { name: "Flutter", category: "Mobile", level: "Expert", offering: true },
          { name: "JavaScript", category: "Frontend", level: "Expert", offering: true },
          { name: "Node.js", category: "Backend", level: "Beginner", offering: false },
          { name: "Python", category: "Backend", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Monday", timeSlots: ["10:00-12:00", "14:00-16:00"] },
          { day: "Wednesday", timeSlots: ["09:00-11:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/lisajohnson" },
          { platform: "Portfolio", url: "https://lisajohnson.dev" },
        ],
      },
      {
        name: "James Brown",
        email: "james@example.com",
        password: "password123",
        bio: "Backend developer specializing in Python and Django. Looking to learn frontend development to become full-stack.",
        location: "Boston, MA",
        videoCallReady: false,
        rating: 4.5,
        reviewCount: 22,
        skills: [
          { name: "Python", category: "Backend", level: "Expert", offering: true },
          { name: "Django", category: "Backend", level: "Expert", offering: true },
          { name: "PostgreSQL", category: "Backend", level: "Expert", offering: true },
          { name: "React", category: "Frontend", level: "Beginner", offering: false },
          { name: "JavaScript", category: "Frontend", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Tuesday", timeSlots: ["11:00-13:00", "16:00-18:00"] },
          { day: "Thursday", timeSlots: ["10:00-12:00", "14:00-16:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/jamesbrown" },
          { platform: "Portfolio", url: "https://jamesbrown.dev" },
        ],
      },
      {
        name: "Maria Garcia",
        email: "maria@example.com",
        password: "password123",
        bio: "Digital marketing specialist with expertise in SEO and content marketing. Want to learn web development to create landing pages.",
        location: "Miami, FL",
        videoCallReady: true,
        rating: 4.7,
        reviewCount: 26,
        skills: [
          { name: "Digital Marketing", category: "Marketing", level: "Expert", offering: true },
          { name: "SEO", category: "Marketing", level: "Expert", offering: true },
          { name: "Content Marketing", category: "Marketing", level: "Expert", offering: true },
          { name: "React", category: "Frontend", level: "Beginner", offering: false },
          { name: "JavaScript", category: "Frontend", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Wednesday", timeSlots: ["12:00-14:00", "16:00-18:00"] },
          { day: "Saturday", timeSlots: ["09:00-11:00", "14:00-16:00"] },
        ],
        portfolioLinks: [
          { platform: "LinkedIn", url: "https://linkedin.com/in/mariagarcia" },
          { platform: "Portfolio", url: "https://mariagarcia.com" },
        ],
      },
      {
        name: "Tom Anderson",
        email: "tom@example.com",
        password: "password123",
        bio: "Cybersecurity expert with knowledge in ethical hacking and network security. Looking to learn Python for security automation.",
        location: "Denver, CO",
        videoCallReady: true,
        rating: 4.8,
        reviewCount: 29,
        skills: [
          { name: "Cybersecurity", category: "Other", level: "Expert", offering: true },
          { name: "Network Security", category: "Other", level: "Expert", offering: true },
          { name: "Ethical Hacking", category: "Other", level: "Expert", offering: true },
          { name: "Python", category: "Backend", level: "Beginner", offering: false },
          { name: "Machine Learning", category: "Data Science", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Monday", timeSlots: ["13:00-15:00", "17:00-19:00"] },
          { day: "Friday", timeSlots: ["10:00-12:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "GitHub", url: "https://github.com/tomanderson" },
          { platform: "LinkedIn", url: "https://linkedin.com/in/tomanderson" },
        ],
      },
      {
        name: "Rachel Lee",
        email: "rachel@example.com",
        password: "password123",
        bio: "Product manager with experience in agile methodologies. Want to learn technical skills to better communicate with developers.",
        location: "Portland, OR",
        videoCallReady: true,
        rating: 4.6,
        reviewCount: 21,
        skills: [
          { name: "Product Management", category: "Other", level: "Expert", offering: true },
          { name: "Agile Methodologies", category: "Other", level: "Expert", offering: true },
          { name: "User Stories", category: "Other", level: "Expert", offering: true },
          { name: "React", category: "Frontend", level: "Beginner", offering: false },
          { name: "JavaScript", category: "Frontend", level: "Beginner", offering: false },
        ],
        availability: [
          { day: "Tuesday", timeSlots: ["09:00-11:00", "13:00-15:00"] },
          { day: "Thursday", timeSlots: ["11:00-13:00", "15:00-17:00"] },
        ],
        portfolioLinks: [
          { platform: "LinkedIn", url: "https://linkedin.com/in/rachellee" },
          { platform: "Portfolio", url: "https://rachellee.com" },
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
