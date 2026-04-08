const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
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
  specializations: {
    type: [String],
    default: []
  },
  experienceYears: {
    type: Number,
    min: 0,
    default: 0
  },
  bio: {
    type: String,
    trim: true
  },
  certifications: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  hireDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
trainerSchema.index({ status: 1 });

// Auto-populate user on find queries
trainerSchema.pre(/^find/, function(next) {
  this.populate({ path: 'user', select: 'name email isActive' });
  next();
});

module.exports = mongoose.model('Trainer', trainerSchema);
