const express = require('express');
const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/reviews
// @desc    Get user reviews
router.get('/', auth, async (req, res) => {
  try {
    const { type = 'received', page = 1, limit = 20 } = req.query;

    let filter = {};
    if (type === 'received') {
      filter.toUserId = req.user._id;
    } else if (type === 'given') {
      filter.fromUserId = req.user._id;
    }

    const reviews = await Review.find(filter)
      .populate('fromUserId', 'name avatar')
      .populate('toUserId', 'name avatar')
      .populate('sessionId', 'skillExchange scheduledAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(filter);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create review
router.post('/', auth, async (req, res) => {
  try {
    const { toUserId, sessionId, rating, comment, criteria } = req.body;

    // Validate session exists and user participated
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user participated in this session
    if (session.hostId.toString() !== req.user._id.toString() && 
        session.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this session' });
    }

    // Check if user is trying to review themselves
    if (toUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      fromUserId: req.user._id,
      sessionId: sessionId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this session' });
    }

    // Validate that the session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    // Create new review
    const review = new Review({
      fromUserId: req.user._id,
      toUserId,
      sessionId,
      rating,
      comment,
      criteria
    });

    await review.save();

    // Populate the review data
    await review.populate('fromUserId', 'name avatar');
    await review.populate('toUserId', 'name avatar');
    await review.populate('sessionId', 'skillExchange scheduledAt');

    // Update user's average rating
    const userReviews = await Review.find({ toUserId });
    const averageRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
    
    await User.findByIdAndUpdate(toUserId, {
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: userReviews.length
    });

    // Create notification for reviewed user
    const notification = new Notification({
      userId: toUserId,
      type: 'review',
      title: 'New Review',
      content: `${req.user.name} left you a ${rating}-star review`,
      relatedId: review._id,
      metadata: {
        reviewId: review._id,
        rating: rating,
        reviewerName: req.user.name
      }
    });

    await notification.save();

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/sessions/:sessionId
// @desc    Get reviews for a specific session
router.get('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ sessionId: req.params.sessionId })
      .populate('fromUserId', 'name avatar')
      .populate('toUserId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Session reviews fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/users/:userId
// @desc    Get reviews for a specific user
router.get('/users/:userId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({ toUserId: req.params.userId })
      .populate('fromUserId', 'name avatar')
      .populate('sessionId', 'skillExchange scheduledAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ toUserId: req.params.userId });

    // Calculate average rating
    const allReviews = await Review.find({ toUserId: req.params.userId });
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
      : 0;

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: allReviews.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('User reviews fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
