const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const compression = require("compression");

const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const server = createServer(app);

// ── Serve React frontend FIRST before any middleware ──────────────────────────
// This must be before Helmet so MIME types are not corrupted by security headers
app.use(express.static(path.join(__dirname, "../Frontend/dist")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Serve index.html for all non-API routes (React Router support)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
});

// CORS — allow only the configured frontend origin
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Initialize Socket.IO
const io = new Server(server, {
  cors: corsOptions,
});

// API Middleware (Helmet only applies to API routes, not static files)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter (Protects all API routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", globalLimiter);


// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes (io passed to requestRoutes for real-time session events)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/friend-requests", require("./routes/friendRequestRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
// Register /api/requests (needs io for real-time events)
app.use("/api/requests", require("./routes/requestRoutes")(io));
// Admin routes
app.use("/api/admin", require("./routes/adminRoutes"));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});




// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO connection handling
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");
const { registerVideoEvents } = require("./socket/videoSignaling");


// Store online users
const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

// Helper to broadcast online users correctly accounting for blocked users
const broadcastOnlineUsers = async (io, onlineUsers, targetSocket = null) => {
  try {
    const activeIds = Array.from(onlineUsers.keys());
    if (activeIds.length === 0) return;

    // Fetch block lists for all active users
    const users = await User.find({ _id: { $in: activeIds } }, '_id blockedUsers');
    const userMap = new Map();
    users.forEach(u => userMap.set(u._id.toString(), u.blockedUsers.map(b => b.toString())));

    const sendToSocket = (socket) => {
      if (!socket.userId) return;
      const myBlockedIds = userMap.get(socket.userId) || [];
      const filteredActiveIds = activeIds.filter(activeId => {
        if (activeId === socket.userId) return true;
        const activeUserBlockedIds = userMap.get(activeId) || [];
        if (myBlockedIds.includes(activeId)) return false;
        if (activeUserBlockedIds.includes(socket.userId)) return false;
        return true;
      });
      socket.emit("online_users", filteredActiveIds);
    };

    if (targetSocket) {
      sendToSocket(targetSocket);
    } else {
      const sockets = await io.fetchSockets();
      sockets.forEach(sendToSocket);
    }
  } catch (err) {
    console.error("Error in broadcastOnlineUsers:", err);
  }
};

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.userId})`);
  console.log(`🔌 Socket ID: ${socket.id}`);

  // Add user to online users
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    lastSeen: new Date(),
  });

  console.log(`👥 Total online users: ${onlineUsers.size}`);
  console.log(`📋 Online user IDs:`, Array.from(onlineUsers.keys()));

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  console.log(`🏠 User joined room: user_${socket.userId}`);

  // Broadcast updated online users to all connected clients individually
  broadcastOnlineUsers(io, onlineUsers);

  // Handle joining a conversation room
  socket.on("join_conversation", (data) => {
    const { conversationId, otherUserId } = data;
    const roomName = `conversation_${conversationId}`;
    socket.join(roomName);
    console.log(
      `User ${socket.user.name} joined conversation ${conversationId}`
    );
  });

  // Handle explicit request for online users
  socket.on("request_online_users", () => {
    broadcastOnlineUsers(io, onlineUsers, socket);
  });

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      console.log("📨 Message received from socket:", {
        sender: socket.user.name,
        senderId: socket.userId,
        data: data,
      });

      const { receiverId, content, messageType = "text" } = data;

      // Check if either user has blocked the other
      const senderObj = await User.findById(socket.userId);
      const receiverObj = await User.findById(receiverId);

      if (!receiverObj) {
        return socket.emit("message_error", { error: "User not found" });
      }

      if (senderObj.blockedUsers?.includes(receiverId)) {
        return socket.emit("message_error", { error: "Unable to send message" });
      }

      if (receiverObj.blockedUsers?.includes(socket.userId)) {
        return socket.emit("message_error", { error: "Unable to send message" });
      }

      // Create message in database
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        content,
        messageType,
      });

      await message.save();
      console.log("💾 Message saved to database:", message._id);

      await message.populate("senderId", "name avatar");
      await message.populate("receiverId", "name avatar");

      // Check if receiver is online
      const receiverSocket = Array.from(onlineUsers.values()).find(
        (user) => String(user.user._id) === String(receiverId)
      );

      console.log("👥 Online users:", Array.from(onlineUsers.keys()));
      console.log("🎯 Looking for receiver:", receiverId);
      console.log("🔍 Receiver socket found:", !!receiverSocket);

      if (receiverSocket) {
        console.log(
          "📤 Sending message to receiver:",
          receiverSocket.user.name
        );
        io.to(`user_${receiverId}`).emit("new_message", {
          message,
          conversationId: `${socket.userId}_${receiverId}`,
        });
      } else {
        console.log(
          "❌ Receiver not online, message saved but not delivered in real-time"
        );
      }

      // Emit back to sender
      console.log("📤 Sending confirmation to sender:", socket.user.name);
      socket.emit("message_sent", { message });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", async (data) => {
    const { receiverId } = data;
    const senderObj = await User.findById(socket.userId);
    const receiverObj = await User.findById(receiverId);
    if (!receiverObj || senderObj?.blockedUsers?.includes(receiverId) || receiverObj?.blockedUsers?.includes(socket.userId)) return;

    socket.to(`user_${receiverId}`).emit("user_typing", {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: true,
    });
  });

  socket.on("typing_stop", async (data) => {
    const { receiverId } = data;
    const senderObj = await User.findById(socket.userId);
    const receiverObj = await User.findById(receiverId);
    if (!receiverObj || senderObj?.blockedUsers?.includes(receiverId) || receiverObj?.blockedUsers?.includes(socket.userId)) return;

    socket.to(`user_${receiverId}`).emit("user_typing", {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: false,
    });
  });

  // Register video call signaling events
  registerVideoEvents(io, socket, onlineUsers);

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.user.name} (${socket.userId})`);
    onlineUsers.delete(socket.userId);
    console.log(`👥 Remaining online users: ${onlineUsers.size}`);
    console.log(`📋 Remaining user IDs:`, Array.from(onlineUsers.keys()));
    
    // Broadcast updated online users to all connected clients
    broadcastOnlineUsers(io, onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});
