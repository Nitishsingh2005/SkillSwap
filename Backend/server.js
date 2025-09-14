const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// DB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
