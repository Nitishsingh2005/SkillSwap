const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = createServer(app);

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Initialize Socket.IO
const io = new Server(server, {
  cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded images
app.use("/uploads", express.static("uploads"));

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

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/friend-requests", require("./routes/friendRequestRoutes"));

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

// 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO connection handling
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

// Store online users
const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.userId})`);
  console.log(`🔌 Socket ID: ${socket.id}`);
  
  // Add user to online users
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    lastSeen: new Date()
  });

  console.log(`👥 Total online users: ${onlineUsers.size}`);
  console.log(`📋 Online user IDs:`, Array.from(onlineUsers.keys()));

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  console.log(`🏠 User joined room: user_${socket.userId}`);

  // Handle joining a conversation room
  socket.on('join_conversation', (data) => {
    const { conversationId, otherUserId } = data;
    const roomName = `conversation_${conversationId}`;
    socket.join(roomName);
    console.log(`User ${socket.user.name} joined conversation ${conversationId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      console.log('📨 Message received from socket:', {
        sender: socket.user.name,
        senderId: socket.userId,
        data: data
      });
      
      const { receiverId, content, messageType = 'text' } = data;
      
      // Create message in database
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        content,
        messageType
      });

      await message.save();
      console.log('💾 Message saved to database:', message._id);
      
      await message.populate('senderId', 'name avatar');
      await message.populate('receiverId', 'name avatar');

      // Check if receiver is online
      const receiverSocket = Array.from(onlineUsers.values())
        .find(user => String(user.user._id) === String(receiverId));
      
      console.log('👥 Online users:', Array.from(onlineUsers.keys()));
      console.log('🎯 Looking for receiver:', receiverId);
      console.log('🔍 Receiver socket found:', !!receiverSocket);
      
      if (receiverSocket) {
        console.log('📤 Sending message to receiver:', receiverSocket.user.name);
        io.to(`user_${receiverId}`).emit('new_message', {
          message,
          conversationId: `${socket.userId}_${receiverId}`
        });
      } else {
        console.log('❌ Receiver not online, message saved but not delivered in real-time');
      }

      // Emit back to sender
      console.log('📤 Sending confirmation to sender:', socket.user.name);
      socket.emit('message_sent', { message });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { receiverId } = data;
    socket.to(`user_${receiverId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { receiverId } = data;
    socket.to(`user_${receiverId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: false
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.name} (${socket.userId})`);
    onlineUsers.delete(socket.userId);
    console.log(`👥 Remaining online users: ${onlineUsers.size}`);
    console.log(`📋 Remaining user IDs:`, Array.from(onlineUsers.keys()));
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
