const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/skills/users
// @desc    Get all users with filtering
router.get('/users', auth, async (req, res) => {
  try {
    const { 
      search, 
      skill, 
      category, 
      level, 
      location, 
      videoCallReady,
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = { _id: { $ne: req.user._id }, isActive: true };

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { 'skills.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Skill filter
    if (skill) {
      filter['skills.name'] = { $regex: skill, $options: 'i' };
    }

    // Category filter
    if (category) {
      filter['skills.category'] = category;
    }

    // Level filter
    if (level) {
      filter['skills.level'] = level;
    }

    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Video call filter
    if (videoCallReady !== undefined) {
      filter.videoCallReady = videoCallReady === 'true';
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/users/:id
// @desc    Get specific user profile
router.get('/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/skills/users/:id/skills
// @desc    Add skill to user
router.post('/users/:id/skills', auth, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, category, level, offering } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newSkill = {
      name,
      category,
      level,
      offering: offering !== undefined ? offering : true
    };

    user.skills.push(newSkill);
    await user.save();

    res.json({
      message: 'Skill added successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/skills/users/:id/skills/:skillId
// @desc    Update skill
router.put('/users/:id/skills/:skillId', auth, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, category, level, offering } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skill = user.skills.id(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    skill.name = name || skill.name;
    skill.category = category || skill.category;
    skill.level = level || skill.level;
    skill.offering = offering !== undefined ? offering : skill.offering;

    await user.save();

    res.json({
      message: 'Skill updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/skills/users/:id/skills/:skillId
// @desc    Remove skill
router.delete('/users/:id/skills/:skillId', auth, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skill = user.skills.id(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    skill.remove();
    await user.save();

    res.json({
      message: 'Skill removed successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
