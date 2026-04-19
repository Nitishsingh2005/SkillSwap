const express = require("express");
const Session = require("../models/Session");
const User = require("../models/User");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// Factory function that accepts io for real-time events
module.exports = (io) => {
const router = express.Router();

// @route   GET /api/requests/sessions
// @desc    Get user's sessions
router.get("/sessions", auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {
      $or: [{ hostId: req.user._id }, { partnerId: req.user._id }],
    };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const sessions = await Session.find(filter)
      .populate("hostId", "name avatar email")
      .populate("partnerId", "name avatar email")
      .sort({ scheduledAt: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/requests/sessions
// @desc    Book new session
router.post("/sessions", auth, async (req, res) => {
  try {
    const { partnerId, scheduledAt, type, skillExchange, notes } = req.body;

    // Validate partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if user is trying to book with themselves
    if (partnerId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot book session with yourself" });
    }

    // Create new session
    const session = new Session({
      hostId: req.user._id,
      partnerId,
      scheduledAt: new Date(scheduledAt),
      type,
      skillExchange,
      notes: notes || "",
    });

    await session.save();

    // Populate the session data
    await session.populate("hostId", "name avatar email");
    await session.populate("partnerId", "name avatar email");

    // Create notification for partner
    const notification = new Notification({
      userId: partnerId,
      type: "booking",
      title: "New Session Request",
      content: `${req.user.name} wants to schedule a session with you`,
      relatedId: session._id,
      metadata: {
        sessionId: session._id,
        hostName: req.user.name,
      },
    });

    await notification.save();

    // Emit real-time socket event to the partner
    if (io) {
      const roomName = `user_${partnerId}`;
      console.log(`Emitting session_created to room: ${roomName}`);
      io.to(roomName).emit('session_created', { session });
    } else {
      console.warn("Socket.io instance not available in requestRoutes");
    }

    res.status(201).json({
      message: "Session booked successfully",
      session,
    });
  } catch (error) {
    console.error("Session booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/requests/sessions/:id
// @desc    Update session status
router.put("/sessions/:id", auth, async (req, res) => {
  try {
    const { status, notes, meetingLink } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is authorized to update this session
    if (
      session.hostId.toString() !== req.user._id.toString() &&
      session.partnerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update session
    if (status) session.status = status;
    if (notes) session.notes = notes;
    if (meetingLink) session.meetingLink = meetingLink;

    await session.save();

    // Populate the session data
    await session.populate("hostId", "name avatar email");
    await session.populate("partnerId", "name avatar email");

    // Create notification for the other user
    const otherUserId =
      session.hostId._id.toString() === req.user._id.toString()
        ? session.partnerId._id
        : session.hostId._id;

    let notificationTitle, notificationContent;

    switch (status) {
      case "confirmed":
        notificationTitle = "Session Confirmed";
        notificationContent = `${req.user.name} confirmed your session request`;
        break;
      case "cancelled":
        notificationTitle = "Session Cancelled";
        notificationContent = `${req.user.name} cancelled your session`;
        break;
      case "completed":
        notificationTitle = "Session Completed";
        notificationContent = `${req.user.name} marked the session as completed`;
        break;
      default:
        notificationTitle = "Session Updated";
        notificationContent = `${req.user.name} updated your session`;
    }

    const notification = new Notification({
      userId: otherUserId,
      type: "booking",
      title: notificationTitle,
      content: notificationContent,
      relatedId: session._id,
      metadata: {
        sessionId: session._id,
        status: status,
        updatedBy: req.user.name,
      },
    });

    await notification.save();

    // Emit real-time socket event to both participants
    if (io) {
      const hostId = session.hostId._id?.toString() || session.hostId.toString();
      const partnerId = session.partnerId._id?.toString() || session.partnerId.toString();
      io.to(`user_${hostId}`).emit('session_updated', { session });
      io.to(`user_${partnerId}`).emit('session_updated', { session });
    }

    res.json({
      message: "Session updated successfully",
      session,
    });
  } catch (error) {
    console.error("Session update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/requests/sessions/:id
// @desc    Cancel session
router.delete("/sessions/:id", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is authorized to cancel this session
    if (
      session.hostId.toString() !== req.user._id.toString() &&
      session.partnerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Session.findByIdAndDelete(req.params.id);

    res.json({ message: "Session cancelled successfully" });
  } catch (error) {
    console.error("Session cancellation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────
// VIDEO CALL ROUTES
// ────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require("uuid");

// @route   GET /api/requests/sessions/:id/join
// @desc    Validate session and get room info for video call
router.get("/sessions/:id/join", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("hostId", "name avatar email")
      .populate("partnerId", "name avatar email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Authorization check
    const userId = req.user._id.toString();
    const isHost = session.hostId._id.toString() === userId;
    const isPartner = session.partnerId._id.toString() === userId;

    if (!isHost && !isPartner) {
      return res
        .status(403)
        .json({ message: "Not authorized for this session" });
    }

    if (!["confirmed", "in-progress"].includes(session.status)) {
      return res
        .status(400)
        .json({
          message: `Session is ${session.status}. Must be confirmed to join.`,
        });
    }

    // Generate roomId if needed
    if (!session.roomId) {
      session.roomId = uuidv4();
      await session.save();
    }

    res.json({
      session,
      roomId: session.roomId,
      isHost,
    });
  } catch (error) {
    console.error("Session join error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/requests/sessions/:id/end-call
// @desc    End a video call and mark session completed
router.put("/sessions/:id/end-call", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const userId = req.user._id.toString();
    if (
      session.hostId.toString() !== userId &&
      session.partnerId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    session.status = "completed";
    session.callEndedAt = new Date();
    await session.save();

    // Update the lastActive timestamp for both participants so they appear at the front of the Active Swappers list
    await User.updateMany(
      { _id: { $in: [session.hostId, session.partnerId] } },
      { $set: { lastActive: new Date() } }
    );

    await session.populate("hostId", "name avatar email");
    await session.populate("partnerId", "name avatar email");

    res.json({ message: "Call ended successfully", session });
  } catch (error) {
    console.error("End call error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/requests/sessions/:id/ice-config
// @desc    Get ICE server configuration for WebRTC
router.get("/sessions/:id/ice-config", auth, async (req, res) => {
  try {
    const iceServers = [
      { urls: process.env.STUN_URL || "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    // Add TURN server if configured
    if (process.env.TURN_URL) {
      iceServers.push({
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME || "",
        credential: process.env.TURN_SECRET || "",
      });
    }

    res.json({ iceServers });
  } catch (error) {
    console.error("ICE config error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

return router;
}; // end factory function
