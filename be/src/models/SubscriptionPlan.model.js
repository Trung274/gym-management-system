const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a plan name'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please provide a plan type'],
    enum: ['basic', 'premium', 'vip']
  },
  durationDays: {
    type: Number,
    required: [true, 'Please provide duration in days'],
    min: [1, 'Duration must be at least 1 day']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
subscriptionPlanSchema.index({ type: 1 });
subscriptionPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
