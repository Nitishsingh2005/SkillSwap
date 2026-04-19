const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/users/:id/block
// @desc    Block a user
router.post('/:id/block', auth, async (req, res) => {
  try {
    const userToBlockId = req.params.id;
    const currentUserId = req.user._id;

    if (userToBlockId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot block yourself." });
    }

    const userToBlock = await User.findById(userToBlockId);
    if (!userToBlock) {
      return res.status(404).json({ message: "User not found." });
    }

    // Add to blockedUsers if not already there
    const currentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { blockedUsers: userToBlockId } },
      { new: true }
    ).populate('blockedUsers', 'name avatar bio location');

    const blockedUsersNoAvatar = currentUser.blockedUsers.map(u => {
      const userObj = u.toObject ? u.toObject() : u;
      userObj.avatar = "";
      return userObj;
    });

    res.json({ message: "User blocked successfully.", blockedUsers: blockedUsersNoAvatar });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/users/:id/unblock
// @desc    Unblock a user
router.post('/:id/unblock', auth, async (req, res) => {
  try {
    const userToUnblockId = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: userToUnblockId } },
      { new: true }
    ).populate('blockedUsers', 'name avatar bio location');

    const blockedUsersNoAvatar = currentUser.blockedUsers.map(u => {
      const userObj = u.toObject ? u.toObject() : u;
      userObj.avatar = "";
      return userObj;
    });

    res.json({ message: "User unblocked successfully.", blockedUsers: blockedUsersNoAvatar });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/users/blocked
// @desc    Get list of blocked users
router.get('/blocked', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate(
      'blockedUsers', 
      'name avatar bio location'
    );
    const blockedUsersNoAvatar = currentUser.blockedUsers.map(u => {
      const userObj = u.toObject ? u.toObject() : u;
      userObj.avatar = "";
      return userObj;
    });
    
    res.json({ blockedUsers: blockedUsersNoAvatar });
  } catch (error) {
    console.error("Get blocked users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/users/:id/report
// @desc    Report a user
router.post('/:id/report', auth, async (req, res) => {
  try {
    const reportedId = req.params.id;
    const reporterId = req.user._id;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Report reason is required." });
    }

    if (reportedId === reporterId.toString()) {
      return res.status(400).json({ message: "Cannot report yourself." });
    }

    const reportedUser = await User.findById(reportedId);
    if (!reportedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if there is already an open report for this user by this reporter
    const existingReport = await Report.findOne({
      reporterId,
      reportedId,
      status: "pending"
    });

    if (existingReport) {
      return res.status(400).json({ message: "You already have a pending report against this user." });
    }

    const report = new Report({
      reporterId,
      reportedId,
      reason
    });

    await report.save();

    res.status(201).json({ message: "User reported successfully." });
  } catch (error) {
    console.error("Report user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
