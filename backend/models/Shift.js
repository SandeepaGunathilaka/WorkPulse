const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'custom'],
    default: 'custom'
  },
  department: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
shiftSchema.index({ employee: 1, date: 1 });
shiftSchema.index({ date: 1 });
shiftSchema.index({ department: 1 });

// Virtual for shift duration
shiftSchema.virtual('duration').get(function() {
  const start = new Date(`2000-01-01T${this.startTime}`);
  const end = new Date(`2000-01-01T${this.endTime}`);
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60 * 60 * 100)) / 100; // hours with 2 decimal places
});

module.exports = mongoose.model('Shift', shiftSchema);