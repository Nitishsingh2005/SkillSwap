const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      skills: [],
      availability: [],
      portfolioLinks: []
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   POST /api/auth/portfolio-links
// @desc    Add portfolio link
router.post('/portfolio-links', auth, async (req, res) => {
  try {
    const { platform, url } = req.body;
    
    if (!platform || !url) {
      return res.status(400).json({ message: 'Platform and URL are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.portfolioLinks.push({ platform, url });
    await user.save();

    res.json({
      message: 'Portfolio link added successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Add portfolio link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/portfolio-links/:linkId
// @desc    Remove portfolio link
router.delete('/portfolio-links/:linkId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const link = user.portfolioLinks.id(req.params.linkId);
    if (!link) {
      return res.status(404).json({ message: 'Portfolio link not found' });
    }

    link.remove();
    await user.save();

    res.json({
      message: 'Portfolio link removed successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Remove portfolio link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/availability
// @desc    Add availability slot
router.post('/availability', auth, async (req, res) => {
  try {
    const { day, timeSlots } = req.body;
    
    if (!day || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: 'Day and timeSlots array are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if day already exists
    const existingDay = user.availability.find(slot => slot.day === day);
    if (existingDay) {
      // Update existing day
      existingDay.timeSlots = timeSlots;
    } else {
      // Add new day
      user.availability.push({ day, timeSlots });
    }

    await user.save();

    res.json({
      message: 'Availability updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Add availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/availability/:slotId
// @desc    Remove availability slot
router.delete('/availability/:slotId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const slot = user.availability.id(req.params.slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Availability slot not found' });
    }

    slot.remove();
    await user.save();

    res.json({
      message: 'Availability slot removed successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Remove availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
