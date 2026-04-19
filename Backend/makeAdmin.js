/**
 * One-time script to grant admin privileges to a user by email.
 * Usage: node makeAdmin.js <email>
 * Example: node makeAdmin.js dc.lilly3103@gmail.com
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email: node makeAdmin.js <email>");
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const result = await User.updateOne({ email }, { $set: { isAdmin: true } });

  if (result.matchedCount === 0) {
    console.error(`❌ No user found with email: ${email}`);
  } else {
    console.log(`✅ isAdmin set to true for: ${email}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
