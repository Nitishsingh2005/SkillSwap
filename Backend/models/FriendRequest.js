const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  },
  message: { 
    type: String, 
    default: '' 
  }
}, {
  timestamps: true
});

// Index for efficient queries
friendRequestSchema.index({ receiverId: 1, status: 1 });

// Prevent duplicate friend requests
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
