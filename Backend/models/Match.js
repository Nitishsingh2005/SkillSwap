const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'liked', 'passed', 'matched'], 
    default: 'pending' 
  },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  passedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// Index for efficient queries
matchSchema.index({ userId: 1, status: 1 });
matchSchema.index({ partnerId: 1, status: 1 });
matchSchema.index({ score: -1 });

module.exports = mongoose.model('Match', matchSchema);
