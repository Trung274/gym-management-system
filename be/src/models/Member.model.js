const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  idCard: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended'],
    default: 'active'
  },
  lastCheckIn: {
    type: Date
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
memberSchema.index({ user: 1 });
memberSchema.index({ status: 1 });
memberSchema.index({ subscriptionPlan: 1 });

// Auto-populate user and subscriptionPlan on find queries
memberSchema.pre(/^find/, function(next) {
  this.populate({ path: 'user', select: 'name email isActive' })
      .populate({ path: 'subscriptionPlan', select: 'name type durationDays price isActive' });
  next();
});

module.exports = mongoose.model('Member', memberSchema);

