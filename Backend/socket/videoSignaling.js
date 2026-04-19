const Session = require("../models/Session");
const Notification = require("../models/Notification");
const { v4: uuidv4 } = require("uuid");

// Active video rooms: Map<sessionId, { host, partner, status, createdAt }>
const videoRooms = new Map();

/**
 * Register video call signaling events on a socket connection.
 * Called from server.js inside io.on('connection', ...).
 */
function registerVideoEvents(io, socket, onlineUsers) {
  // ── Join a video room tied to a session ──────────────────────────
  socket.on("video:join_room", async ({ sessionId }) => {
    try {
      const session = await Session.findById(sessionId)
        .populate("hostId", "name avatar")
        .populate("partnerId", "name avatar");

      if (!session) {
        return socket.emit("video:error", { message: "Session not found" });
      }

      const userId = socket.userId;
      const isHost = session.hostId._id.toString() === userId;
      const isPartner = session.partnerId._id.toString() === userId;

      if (!isHost && !isPartner) {
        return socket.emit("video:error", {
          message: "Not authorized for this session",
        });
      }

      if (!["confirmed", "in-progress"].includes(session.status)) {
        return socket.emit("video:error", {
          message: `Session is ${session.status}. Must be confirmed to join.`,
        });
      }

      // Generate roomId if not set
      if (!session.roomId) {
        session.roomId = uuidv4();
        await session.save();
      }

      const roomName = `video_${sessionId}`;
      socket.join(roomName);

      // Initialize or update room state
      let room = videoRooms.get(sessionId);
      if (!room) {
        room = {
          host: null,
          partner: null,
          status: "waiting",
          createdAt: new Date(),
        };
        videoRooms.set(sessionId, room);
      }

      // Assign participant
      if (isHost) {
        room.host = { socketId: socket.id, userId, user: session.hostId };
      } else {
        room.partner = { socketId: socket.id, userId, user: session.partnerId };
      }

      console.log(
        `📹 ${isHost ? "Host" : "Partner"} joined video room ${sessionId}`
      );

      // Notify the joiner of current room state
      socket.emit("video:room_joined", {
        sessionId,
        roomId: session.roomId,
        session: {
          _id: session._id,
          hostId: session.hostId,
          partnerId: session.partnerId,
          skillExchange: session.skillExchange,
          scheduledAt: session.scheduledAt,
          type: session.type,
        },
        isHost,
        roomStatus: room.status,
        peerPresent: isHost ? !!room.partner : !!room.host,
      });

      // Check if both participants are now present
      if (room.host && room.partner) {
        room.status = "active";

        // Update session to in-progress
        session.status = "in-progress";
        if (!session.callStartedAt) {
          session.callStartedAt = new Date();
        }
        await session.save();

        // Notify both peers they can start the WebRTC connection
        // The host will be the initiator
        io.to(room.host.socketId).emit("video:peer_ready", {
          sessionId,
          isInitiator: true,
          peer: {
            name: room.partner.user.name,
            avatar: room.partner.user.avatar,
          },
        });

        io.to(room.partner.socketId).emit("video:peer_ready", {
          sessionId,
          isInitiator: false,
          peer: { name: room.host.user.name, avatar: room.host.user.avatar },
        });

        console.log(`📹 Both peers ready in room ${sessionId}`);
      } else {
        // First person in — notify the other user
        const otherUserId = isHost
          ? session.partnerId._id.toString()
          : session.hostId._id.toString();

        // Send real-time notification via socket
        io.to(`user_${otherUserId}`).emit("video:call_invitation", {
          sessionId,
          from: isHost ? session.hostId : session.partnerId,
          skillExchange: session.skillExchange,
        });

        // Persist notification
        const notification = new Notification({
          userId: otherUserId,
          type: "video_call",
          title: "Video Call Starting",
          content: `${
            isHost ? session.hostId.name : session.partnerId.name
          } is waiting for you in a video session`,
          relatedId: session._id,
          metadata: { sessionId: session._id.toString() },
        });
        await notification.save();
      }
    } catch (error) {
      console.error("video:join_room error:", error);
      socket.emit("video:error", { message: "Failed to join video room" });
    }
  });

  // ── Relay WebRTC signaling data ──────────────────────────────────
  socket.on("video:signal", ({ sessionId, signalData }) => {
    const room = videoRooms.get(sessionId);
    if (!room) {
      console.log(`📹 Signal: no room for session ${sessionId}`);
      return;
    }

    const roomName = `video_${sessionId}`;
    socket.to(roomName).emit("video:signal", {
      sessionId,
      signalData,
    });
  });

  // ── Leave video room ─────────────────────────────────────────────
  socket.on("video:leave_room", async ({ sessionId }) => {
    handleLeaveRoom(io, socket, sessionId);
  });

  // ── Toggle media state (mic/camera) ──────────────────────────────
  socket.on("video:toggle_media", ({ sessionId, audio, video }) => {
    const room = videoRooms.get(sessionId);
    if (!room) return;

    const roomName = `video_${sessionId}`;
    socket.to(roomName).emit("video:media_state_changed", {
      sessionId,
      userId: socket.userId,
      audio,
      video,
    });
  });

  // ── Screen share notifications ───────────────────────────────────
  socket.on("video:screen_share_started", ({ sessionId }) => {
    const room = videoRooms.get(sessionId);
    if (!room) return;

    const roomName = `video_${sessionId}`;
    socket.to(roomName).emit("video:screen_share_started", {
      sessionId,
      userId: socket.userId,
    });
  });

  socket.on("video:screen_share_stopped", ({ sessionId }) => {
    const room = videoRooms.get(sessionId);
    if (!room) return;

    const roomName = `video_${sessionId}`;
    socket.to(roomName).emit("video:screen_share_stopped", {
      sessionId,
      userId: socket.userId,
    });
  });

  // ── In-call chat message (ephemeral, no DB) ─────────────────────
  socket.on("video:chat_message", ({ sessionId, message }) => {
    const room = videoRooms.get(sessionId);
    if (!room) return;

    const roomName = `video_${sessionId}`;
    // Broadcast to everyone in room EXCEPT sender
    socket.to(roomName).emit("video:chat_message", {
      sessionId,
      message: {
        id: uuidv4(),
        content: message,
        senderId: socket.userId,
        senderName: socket.user.name,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ── Whiteboard draw events ───────────────────────────────────────
  socket.on("video:whiteboard_draw", ({ sessionId, strokeData }) => {
    const room = videoRooms.get(sessionId);
    if (!room) {
      console.log(`📝 Whiteboard draw: no room found for session ${sessionId}`);
      console.log(`📝 Active rooms:`, Array.from(videoRooms.keys()));
      return;
    }

    // Broadcast to the video room, excluding the sender
    const roomName = `video_${sessionId}`;
    socket.to(roomName).emit("video:whiteboard_draw", {
      sessionId,
      strokeData,
      userId: socket.userId,
    });
  });

  socket.on("video:whiteboard_clear", ({ sessionId }) => {
    const roomName = `video_${sessionId}`;
    // Broadcast to room, excluding sender
    socket.to(roomName).emit("video:whiteboard_clear", { sessionId });
  });

  // ── Reactions (raise hand, emojis) ───────────────────────────────
  socket.on("video:reaction", ({ sessionId, type }) => {
    const roomName = `video_${sessionId}`;
    io.to(roomName).emit("video:reaction", {
      sessionId,
      userId: socket.userId,
      userName: socket.user.name,
      type,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Clean up on disconnect ───────────────────────────────────────
  socket.on("disconnect", () => {
    // Find any room this socket is in and clean up
    for (const [sessionId, room] of videoRooms.entries()) {
      if (
        (room.host && room.host.socketId === socket.id) ||
        (room.partner && room.partner.socketId === socket.id)
      ) {
        handleLeaveRoom(io, socket, sessionId);
      }
    }
  });
}

/**
 * Handle a user leaving a video room — cleanup and notify peer.
 */
async function handleLeaveRoom(io, socket, sessionId) {
  const room = videoRooms.get(sessionId);
  if (!room) return;

  const roomName = `video_${sessionId}`;
  const isHost = room.host && room.host.userId === socket.userId;

  // Clear the leaving participant
  if (isHost) {
    room.host = null;
  } else {
    room.partner = null;
  }

  // Notify remaining peer by broadcasting to the room EXCEPT the leaving sender
  socket.to(roomName).emit("video:peer_left", {
    sessionId,
    userId: socket.userId,
  });

  socket.leave(roomName);

  // If both gone, clean up room and mark session
  if (!room.host && !room.partner) {
    videoRooms.delete(sessionId);

    try {
      const session = await Session.findById(sessionId);
      if (session && session.status === "in-progress") {
        session.status = "completed";
        session.callEndedAt = new Date();
        await session.save();
      }
    } catch (err) {
      console.error("Error completing session after call:", err);
    }
  }

  console.log(`📹 User ${socket.userId} left video room ${sessionId}`);
}

module.exports = { registerVideoEvents, videoRooms };
