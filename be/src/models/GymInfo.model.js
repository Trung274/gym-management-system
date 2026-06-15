const mongoose = require('mongoose');

const gymInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide gym name'],
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
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
  website: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  coverImageUrl: {
    type: String,
    trim: true
  },
  openingHours: {
    type: String,
    trim: true
  },
  socialLinks: {
    type: String,
    trim: true
  },
  established: {
    type: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('GymInfo', gymInfoSchema);
