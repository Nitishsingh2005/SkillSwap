const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Report = require("../models/Report");

// Admin guard middleware — user must be authenticated AND have isAdmin: true
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// @route   GET /api/admin/reports
// @desc    Get all reports (paginated, filterable by status)
router.get("/reports", auth, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate("reporterId", "name email avatar")
      .populate("reportedId", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Admin get reports error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PATCH /api/admin/reports/:id
// @desc    Update report status and/or adminNotes
router.patch("/reports/:id", auth, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const allowedStatuses = ["pending", "reviewed", "resolved", "dismissed"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    await report.save();

    await report.populate("reporterId", "name email avatar");
    await report.populate("reportedId", "name email avatar");

    res.json({ message: "Report updated successfully", report });
  } catch (error) {
    console.error("Admin update report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/admin/reports/stats
// @desc    Get report counts by status
router.get("/reports/stats", auth, adminOnly, async (req, res) => {
  try {
    const stats = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const result = { pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
    stats.forEach(({ _id, count }) => {
      if (_id in result) result[_id] = count;
    });
    res.json({ stats: result });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
