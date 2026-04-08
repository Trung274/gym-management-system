const mongoose = require('mongoose');

const scheduleItemSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
  }
}, { _id: false });

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['yoga', 'zumba', 'cycling', 'hiit', 'pilates', 'boxing', 'other'],
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    trim: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    default: null
  },
  location: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    min: 1
  },
  schedule: {
    type: [scheduleItemSchema],
    required: [true, 'At least one schedule item is required'],
    validate: {
      validator: arr => arr.length > 0,
      message: 'Schedule must have at least one item'
    }
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
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
classSchema.index({ category: 1, status: 1 });
classSchema.index({ trainer: 1 });

// Auto-populate trainer + trainer.user on find
classSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'trainer',
    populate: { path: 'user', select: 'name email' }
  });
  next();
});

module.exports = mongoose.model('Class', classSchema);
