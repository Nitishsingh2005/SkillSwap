const mongoose = require('mongoose');

const skillExchangeSchema = new mongoose.Schema({
  hostSkill: { type: String, required: true },
  partnerSkill: { type: String, required: true }
});

const sessionSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  type: { 
    type: String, 
    enum: ['video', 'chat'], 
    default: 'video' 
  },
  skillExchange: skillExchangeSchema,
  notes: { type: String, default: '' },
  meetingLink: { type: String, default: '' }
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ hostId: 1, scheduledAt: 1 });
sessionSchema.index({ partnerId: 1, scheduledAt: 1 });
sessionSchema.index({ status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
