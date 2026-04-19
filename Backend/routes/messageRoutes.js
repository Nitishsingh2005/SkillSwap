const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { uploadMessageFile } = require('../middleware/uploadMessage');
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
          ],
          deletedBy: { $ne: req.user._id }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', new mongoose.Types.ObjectId(req.user._id)] },
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
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(req.user._id)] },
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

    const currentUser = await User.findById(req.user._id);

    // Scrub avatar if there's a block relationship
    const scrubbedConversations = conversations.map(conv => {
      const isBlockedByMe = currentUser.blockedUsers?.includes(conv.user._id);
      const isBlockedByThem = conv.user.blockedUsers?.some(userId => userId.toString() === req.user._id.toString());
      
      if (isBlockedByMe || isBlockedByThem) {
        conv.user.avatar = "";
        conv.user.lastActive = null;
      }
      
      // Cleanup sensitive data
      delete conv.user.blockedUsers;
      
      return conv;
    });

    res.json({ conversations: scrubbedConversations });
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
      ],
      deletedBy: { $ne: req.user._id }
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

    const currentUser = await User.findById(req.user._id);
    const otherUser = await User.findById(otherUserId);
    
    const isBlockedByMe = currentUser.blockedUsers?.includes(otherUserId);
    const isBlockedByThem = otherUser.blockedUsers?.includes(req.user._id);
    const isBlocked = isBlockedByMe || isBlockedByThem;

    let scrubbedMessages = messages.reverse();
    if (isBlocked) {
      scrubbedMessages = scrubbedMessages.map(msg => {
        const msgObj = msg.toObject ? msg.toObject() : msg;
        if (msgObj.senderId && msgObj.senderId.avatar) msgObj.senderId.avatar = "";
        if (msgObj.receiverId && msgObj.receiverId.avatar) msgObj.receiverId.avatar = "";
        return msgObj;
      });
    }

    res.json({ messages: scrubbedMessages });
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

    // Check if either user has blocked the other
    const sender = await User.findById(req.user._id);
    const isReceiverBlockedBySender = sender.blockedUsers?.includes(receiverId);
    if (isReceiverBlockedBySender) {
      return res.status(403).json({ message: 'Unable to send message' });
    }

    const isSenderBlockedByReceiver = receiver.blockedUsers?.includes(req.user._id);
    if (isSenderBlockedByReceiver) {
      return res.status(403).json({ message: 'Unable to send message' });
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

// @route   DELETE /api/messages/conversations/:id/clear
// @desc    Clear conversation for the current user
router.delete('/conversations/:id/clear', auth, async (req, res) => {
  try {
    const otherUserId = req.params.id;

    // Add current user to deletedBy array for all messages between these two users
    await Message.updateMany(
      {
        $or: [
          { senderId: req.user._id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.user._id }
        ]
      },
      { $addToSet: { deletedBy: req.user._id } }
    );

    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/upload
// @desc    Upload an image or file for a message
router.post('/upload', auth, uploadMessageFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine message type based on mimetype
    const isImage = req.file.mimetype.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';

    // The file path relative to the public directory
    // We store in uploads/messages, so path is /uploads/messages/filename
    const fileUrl = `/uploads/messages/${req.file.filename}`;

    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl,
      messageType,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   POST /api/messages/send
// @desc    Send message directly by receiverId (used by InCallChat for DB persistence)
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'receiverId and content are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sender = await User.findById(req.user._id);
    if (sender.blockedUsers?.map(id => id.toString()).includes(receiverId)) {
      return res.status(403).json({ message: 'Unable to send message' });
    }
    if (receiver.blockedUsers?.map(id => id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Unable to send message' });
    }

    const message = new Message({
      senderId: req.user._id,
      receiverId,
      content,
      messageType,
    });
    await message.save();
    await message.populate('senderId', 'name avatar');
    await message.populate('receiverId', 'name avatar');

    res.status(201).json({ message: 'Message sent', messageData: message });
  } catch (error) {
    console.error('Direct message send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/with/:userId
// @desc    Get message history with a specific user (used by InCallChat to load history)
router.get('/with/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user._id },
      ],
      deletedBy: { $ne: req.user._id },
    })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ messages });
  } catch (error) {
    console.error('Messages with user fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

