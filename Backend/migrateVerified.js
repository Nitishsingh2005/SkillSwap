require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await User.updateMany(
    { isEmailVerified: { $ne: true } },
    { $set: { isEmailVerified: true } }
  );
  console.log("✅ Existing users marked as verified:", result.modifiedCount);
  await mongoose.disconnect();
}).catch(console.error);
