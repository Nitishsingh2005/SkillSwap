const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @route   POST /api/friend-requests
// @desc    Send friend request
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, message = "" } = req.body;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends or request exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId: req.user._id, receiverId },
        { senderId: receiverId, receiverId: req.user._id },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Friend request already exists or users are already connected",
      });
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      senderId: req.user._id,
      receiverId,
      message,
    });

    await friendRequest.save();
    await friendRequest.populate("senderId", "name avatar");
    await friendRequest.populate("receiverId", "name avatar");

    // Create notification for receiver
    const notification = new Notification({
      userId: receiverId,
      type: "system",
      title: "New Friend Request",
      content: `${req.user.name} sent you a friend request`,
      relatedId: friendRequest._id,
      metadata: {
        friendRequestId: friendRequest._id,
        senderName: req.user.name,
        message: message,
      },
    });

    await notification.save();

    res.status(201).json({
      message: "Friend request sent successfully",
      friendRequest,
    });
  } catch (error) {
    console.error("Friend request send error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/friend-requests
// @desc    Get friend requests (sent and received)
router.get("/", auth, async (req, res) => {
  try {
    const { type = "received" } = req.query; // 'sent' or 'received'

    let query = {};
    if (type === "sent") {
      query.senderId = req.user._id;
    } else {
      query.receiverId = req.user._id;
      // Only show pending requests for received requests
      query.status = "pending";
    }

    console.log("Friend requests query:", query);
    const friendRequests = await FriendRequest.find(query)
      .populate("senderId", "name avatar")
      .populate("receiverId", "name avatar")
      .sort({ createdAt: -1 });

    console.log("Found friend requests:", friendRequests.length);
    friendRequests.forEach((req) => {
      console.log(
        `- ID: ${req._id}, Status: ${req.status}, From: ${req.senderId.name}`
      );
    });

    res.json({ friendRequests });
  } catch (error) {
    console.error("Get friend requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/friend-requests/:id/accept
// @desc    Accept friend request
router.put("/:id/accept", auth, async (req, res) => {
  try {
    console.log("Accept friend request attempt:", {
      requestId: req.params.id,
      userId: req.user._id,
      userName: req.user.name,
    });

    const friendRequest = await FriendRequest.findById(req.params.id);

    if (!friendRequest) {
      console.log("Friend request not found:", req.params.id);
      return res.status(404).json({ message: "Friend request not found" });
    }

    console.log("Found friend request:", {
      id: friendRequest._id,
      status: friendRequest.status,
      senderId: friendRequest.senderId,
      receiverId: friendRequest.receiverId,
      currentUserId: req.user._id,
    });

    if (friendRequest.receiverId.toString() !== req.user._id.toString()) {
      console.log("Authorization failed:", {
        requestReceiverId: friendRequest.receiverId.toString(),
        currentUserId: req.user._id.toString(),
      });
      return res
        .status(403)
        .json({ message: "Not authorized to accept this request" });
    }

    if (friendRequest.status !== "pending") {
      console.log("Request already processed:", {
        requestId: friendRequest._id,
        currentStatus: friendRequest.status,
      });
      return res
        .status(400)
        .json({ message: "Friend request already processed" });
    }

    // Update friend request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Clean up any other pending requests between these users
    await FriendRequest.updateMany(
      {
        $or: [
          {
            senderId: friendRequest.senderId,
            receiverId: friendRequest.receiverId,
          },
          {
            senderId: friendRequest.receiverId,
            receiverId: friendRequest.senderId,
          },
        ],
        status: "pending",
        _id: { $ne: friendRequest._id },
      },
      { status: "declined" }
    );

    // Add to friends list for both users
    await User.findByIdAndUpdate(friendRequest.senderId, {
      $addToSet: { friends: friendRequest.receiverId },
    });

    await User.findByIdAndUpdate(friendRequest.receiverId, {
      $addToSet: { friends: friendRequest.senderId },
    });

    // Create notification for sender
    const notification = new Notification({
      userId: friendRequest.senderId,
      type: "system",
      title: "Friend Request Accepted",
      content: `${req.user.name} accepted your friend request`,
      relatedId: friendRequest._id,
      metadata: {
        friendRequestId: friendRequest._id,
        receiverName: req.user.name,
      },
    });

    await notification.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/friend-requests/:id/decline
// @desc    Decline friend request
router.put("/:id/decline", auth, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.id);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.receiverId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to decline this request" });
    }
    if (friendRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Friend request already processed" });
    }
    friendRequest.status = "declined";
    await friendRequest.save();
    res.status(200).json({ message: "Friend request declined" });
  } catch (error) {
    console.error("Decline friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/friend-requests/friends
// @desc    Get user's friends list (paginated)
router.get("/friends", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    console.log("Fetching friends for user:", req.user._id);

    // Fetch raw user to get total friend count before filtering
    const rawUser = await User.findById(req.user._id);
    console.log("Raw user friends count:", rawUser?.friends?.length || 0);

    // Fetch populated user
    const user = await User.findById(req.user._id)
      .populate("friends", "name avatar email location bio skills blockedUsers")
      .select("friends blockedUsers");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out null friends and blocked relationships
    const validFriends = user.friends
      .filter((f) => {
        if (!f) return false;
        const isBlockedByMe = user.blockedUsers?.includes(f._id);
        const isBlockedByThem = f.blockedUsers?.includes(user._id);
        return !isBlockedByMe && !isBlockedByThem;
      })
      .map((f) => {
        const friendObj = f.toObject ? f.toObject() : f;
        delete friendObj.blockedUsers;
        return friendObj;
      });

    // Apply pagination in-memory after filtering
    const totalFriends = validFriends.length;
    const totalPages = Math.ceil(totalFriends / limitNum) || 1;
    const paginatedFriends = validFriends.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    console.log(`Sending ${paginatedFriends.length} of ${totalFriends} valid friends (page ${pageNum}/${totalPages})`);

    res.json({
      friends: paginatedFriends,
      totalFriends,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
