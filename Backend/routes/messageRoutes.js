const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all conversations for the current user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user._id] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          'user.password': 0
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/conversations/:id/messages
// @desc    Get conversation messages
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const otherUserId = req.params.id;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user._id }
      ]
    })
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/conversations/:id/messages
// @desc    Send message
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { content, messageType = 'text', sessionId } = req.body;
    const receiverId = req.params.id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new message
    const message = new Message({
      senderId: req.user._id,
      receiverId,
      content,
      messageType,
      sessionId: sessionId || null
    });

    await message.save();

    // Populate the message data
    await message.populate('senderId', 'name avatar');
    await message.populate('receiverId', 'name avatar');

    // Create notification for receiver
    const notification = new Notification({
      userId: receiverId,
      type: 'message',
      title: 'New Message',
      content: `${req.user.name} sent you a message`,
      relatedId: message._id,
      metadata: {
        messageId: message._id,
        senderName: req.user.name,
        preview: content.substring(0, 100)
      }
    });

    await notification.save();

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the receiver
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
