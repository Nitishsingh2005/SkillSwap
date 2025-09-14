const mongoose = require('mongoose');

const criteriaSchema = new mongoose.Schema({
  communication: { type: Number, min: 1, max: 5, required: true },
  skillLevel: { type: Number, min: 1, max: 5, required: true },
  punctuality: { type: Number, min: 1, max: 5, required: true }
});

const reviewSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  criteria: criteriaSchema
}, {
  timestamps: true
});

// Ensure one review per session per user
reviewSchema.index({ fromUserId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
