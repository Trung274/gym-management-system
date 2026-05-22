const mongoose = require('mongoose');

const checkinLogSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Member is required']
  },
  checkinAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common query patterns
checkinLogSchema.index({ member: 1, checkinAt: -1 });
checkinLogSchema.index({ checkinAt: -1 });

// Auto-populate member + member.user on find
checkinLogSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'member',
    populate: { path: 'user', select: 'name email' }
  });
  next();
});

module.exports = mongoose.model('CheckinLog', checkinLogSchema);
