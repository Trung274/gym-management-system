const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  sessionDate: {
    type: Date,
    required: [true, 'Please provide a session date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide a start time (HH:MM)'],
    match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide an end time (HH:MM)'],
    match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ trainer: 1, sessionDate: 1, status: 1 });
bookingSchema.index({ member: 1, status: 1 });

// Populate member and trainer on find
bookingSchema.pre(/^find/, function(next) {
  this.populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'trainer', populate: { path: 'user', select: 'name email' } });
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
