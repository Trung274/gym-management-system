const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'free_weights', 'other'],
    required: [true, 'Category is required']
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
    // sparse unique enforced via schema.index() below
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1']
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'out_of_order'],
    default: 'operational'
  },
  location: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
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
equipmentSchema.index({ category: 1, status: 1 });
equipmentSchema.index({ serialNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
