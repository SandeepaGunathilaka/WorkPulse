const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'emergency', 'study', 'personal'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  documents: [{
    filename: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  appliedDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedDate: Date,
  remarks: String,
  department: {
    type: String,
    required: true
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: function() {
      return this.isHalfDay;
    }
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  cancelledDate: Date
}, {
  timestamps: true
});

// Indexes
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ department: 1 });
leaveSchema.index({ type: 1 });

// Calculate number of days before saving
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    // Reset time to calculate full days
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    this.totalDays = this.isHalfDay ? 0.5 : diffDays;
  }

  next();
});

// Validate date range
leaveSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after or equal to start date'));
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);