const express = require('express');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/matches
// @desc    Get skill matches for user
router.get('/', auth, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const matches = await Match.find({
      userId: req.user._id,
      status: status
    })
    .populate('partnerId', 'name avatar bio skills location rating videoCallReady')
    .sort({ score: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Match.countDocuments({
      userId: req.user._id,
      status: status
    });

    res.json({
      matches,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Matches fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/matches/:id/like
// @desc    Like a match
router.post('/:id/like', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check if user is authorized
    if (match.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add user to likedBy array if not already there
    if (!match.likedBy.includes(req.user._id)) {
      match.likedBy.push(req.user._id);
    }

    // Remove from passedBy if present
    match.passedBy = match.passedBy.filter(id => id.toString() !== req.user._id.toString());

    // Check if both users liked each other
    const partnerMatch = await Match.findOne({
      userId: match.partnerId,
      partnerId: req.user._id
    });

    if (partnerMatch && partnerMatch.likedBy.includes(match.partnerId)) {
      match.status = 'matched';
      partnerMatch.status = 'matched';

      await partnerMatch.save();

      // Create notifications for both users
      const notification1 = new Notification({
        userId: req.user._id,
        type: 'match',
        title: 'New Match!',
        content: `You and ${match.partnerId.name} liked each other!`,
        relatedId: match._id,
        metadata: {
          matchId: match._id,
          partnerName: match.partnerId.name
        }
      });

      const notification2 = new Notification({
        userId: match.partnerId,
        type: 'match',
        title: 'New Match!',
        content: `You and ${req.user.name} liked each other!`,
        relatedId: partnerMatch._id,
        metadata: {
          matchId: partnerMatch._id,
          partnerName: req.user.name
        }
      });

      await Promise.all([notification1.save(), notification2.save()]);
    } else {
      match.status = 'liked';
    }

    await match.save();

    res.json({
      message: 'Match liked successfully',
      match
    });
  } catch (error) {
    console.error('Like match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/matches/:id/pass
// @desc    Pass on a match
router.post('/:id/pass', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check if user is authorized
    if (match.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add user to passedBy array if not already there
    if (!match.passedBy.includes(req.user._id)) {
      match.passedBy.push(req.user._id);
    }

    // Remove from likedBy if present
    match.likedBy = match.likedBy.filter(id => id.toString() !== req.user._id.toString());

    match.status = 'passed';
    await match.save();

    res.json({
      message: 'Match passed successfully',
      match
    });
  } catch (error) {
    console.error('Pass match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/matches/generate
// @desc    Generate new matches for user (algorithm)
router.post('/generate', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all other users
    const otherUsers = await User.find({
      _id: { $ne: req.user._id },
      isActive: true
    }).select('-password');

    const newMatches = [];

    for (const user of otherUsers) {
      // Check if match already exists
      const existingMatch = await Match.findOne({
        userId: req.user._id,
        partnerId: user._id
      });

      if (existingMatch) continue;

      // Calculate match score based on skills compatibility
      let score = 0;
      let reason = '';

      const userSkillsOffering = currentUser.skills.filter(skill => skill.offering);
      const userSkillsSeeking = currentUser.skills.filter(skill => !skill.offering);
      const partnerSkillsOffering = user.skills.filter(skill => skill.offering);
      const partnerSkillsSeeking = user.skills.filter(skill => !skill.offering);

      // Check skill compatibility
      let skillMatches = 0;
      for (const seekingSkill of userSkillsSeeking) {
        const matchingSkill = partnerSkillsOffering.find(
          skill => skill.name.toLowerCase() === seekingSkill.name.toLowerCase()
        );
        if (matchingSkill) {
          skillMatches++;
          score += 20; // Base score for skill match
          
          // Bonus for skill level compatibility
          if (matchingSkill.level === 'Expert' && seekingSkill.level === 'Beginner') {
            score += 10;
          } else if (matchingSkill.level === seekingSkill.level) {
            score += 5;
          }
        }
      }

      // Check reverse compatibility
      for (const seekingSkill of partnerSkillsSeeking) {
        const matchingSkill = userSkillsOffering.find(
          skill => skill.name.toLowerCase() === seekingSkill.name.toLowerCase()
        );
        if (matchingSkill) {
          skillMatches++;
          score += 20;
        }
      }

      // Location bonus
      if (currentUser.location && user.location) {
        if (currentUser.location.toLowerCase() === user.location.toLowerCase()) {
          score += 15;
        }
      }

      // Video call compatibility
      if (currentUser.videoCallReady && user.videoCallReady) {
        score += 10;
      }

      // Rating bonus
      if (user.rating > 0) {
        score += Math.min(user.rating * 2, 10);
      }

      // Only create matches with score >= 50
      if (score >= 50) {
        // Generate reason
        if (skillMatches > 0) {
          const userOffering = userSkillsOffering.map(s => s.name).join(', ');
          const userSeeking = userSkillsSeeking.map(s => s.name).join(', ');
          const partnerOffering = partnerSkillsOffering.map(s => s.name).join(', ');
          const partnerSeeking = partnerSkillsSeeking.map(s => s.name).join(', ');
          
          reason = `Skill compatibility: You offer ${userOffering} and want to learn ${userSeeking}. ${user.name} offers ${partnerOffering} and wants to learn ${partnerSeeking}.`;
        } else {
          reason = `Potential learning partner based on your profiles and preferences.`;
        }

        const match = new Match({
          userId: req.user._id,
          partnerId: user._id,
          reason,
          score: Math.min(score, 100)
        });

        newMatches.push(match);
      }
    }

    // Save all new matches
    if (newMatches.length > 0) {
      await Match.insertMany(newMatches);
    }

    res.json({
      message: `Generated ${newMatches.length} new matches`,
      matches: newMatches
    });
  } catch (error) {
    console.error('Generate matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
