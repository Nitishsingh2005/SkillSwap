const express = require('express');
const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/requests/sessions
// @desc    Get user's sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {
      $or: [
        { hostId: req.user._id },
        { partnerId: req.user._id }
      ]
    };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const sessions = await Session.find(filter)
      .populate('hostId', 'name avatar email')
      .populate('partnerId', 'name avatar email')
      .sort({ scheduledAt: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/requests/sessions
// @desc    Book new session
router.post('/sessions', auth, async (req, res) => {
  try {
    const { partnerId, scheduledAt, type, skillExchange, notes } = req.body;

    // Validate partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Check if user is trying to book with themselves
    if (partnerId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot book session with yourself' });
    }

    // Create new session
    const session = new Session({
      hostId: req.user._id,
      partnerId,
      scheduledAt: new Date(scheduledAt),
      type,
      skillExchange,
      notes: notes || ''
    });

    await session.save();

    // Populate the session data
    await session.populate('hostId', 'name avatar email');
    await session.populate('partnerId', 'name avatar email');

    // Create notification for partner
    const notification = new Notification({
      userId: partnerId,
      type: 'booking',
      title: 'New Session Request',
      content: `${req.user.name} wants to schedule a session with you`,
      relatedId: session._id,
      metadata: {
        sessionId: session._id,
        hostName: req.user.name
      }
    });

    await notification.save();

    res.status(201).json({
      message: 'Session booked successfully',
      session
    });
  } catch (error) {
    console.error('Session booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/sessions/:id
// @desc    Update session status
router.put('/sessions/:id', auth, async (req, res) => {
  try {
    const { status, notes, meetingLink } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized to update this session
    if (session.hostId.toString() !== req.user._id.toString() && 
        session.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update session
    if (status) session.status = status;
    if (notes) session.notes = notes;
    if (meetingLink) session.meetingLink = meetingLink;

    await session.save();

    // Populate the session data
    await session.populate('hostId', 'name avatar email');
    await session.populate('partnerId', 'name avatar email');

    // Create notification for the other user
    const otherUserId = session.hostId._id.toString() === req.user._id.toString() 
      ? session.partnerId._id 
      : session.hostId._id;

    let notificationTitle, notificationContent;
    
    switch (status) {
      case 'confirmed':
        notificationTitle = 'Session Confirmed';
        notificationContent = `${req.user.name} confirmed your session request`;
        break;
      case 'cancelled':
        notificationTitle = 'Session Cancelled';
        notificationContent = `${req.user.name} cancelled your session`;
        break;
      case 'completed':
        notificationTitle = 'Session Completed';
        notificationContent = `${req.user.name} marked the session as completed`;
        break;
      default:
        notificationTitle = 'Session Updated';
        notificationContent = `${req.user.name} updated your session`;
    }

    const notification = new Notification({
      userId: otherUserId,
      type: 'booking',
      title: notificationTitle,
      content: notificationContent,
      relatedId: session._id,
      metadata: {
        sessionId: session._id,
        status: status,
        updatedBy: req.user.name
      }
    });

    await notification.save();

    res.json({
      message: 'Session updated successfully',
      session
    });
  } catch (error) {
    console.error('Session update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/requests/sessions/:id
// @desc    Cancel session
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized to cancel this session
    if (session.hostId.toString() !== req.user._id.toString() && 
        session.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Session.findByIdAndDelete(req.params.id);

    res.json({ message: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Session cancellation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
