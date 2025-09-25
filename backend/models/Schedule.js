const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'custom'],
      required: true
    },
    startTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    breakDuration: {
      type: Number, // in minutes
      default: 30
    }
  },
  department: {
    type: String,
    required: true
  },
  location: {
    building: String,
    floor: String,
    unit: String,
    room: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: function() {
        return this.isRecurring;
      }
    },
    endDate: Date,
    daysOfWeek: [{ // For weekly recurring
      type: Number, // 0-6, where 0 is Sunday
      min: 0,
      max: 6
    }],
    dayOfMonth: { // For monthly recurring
      type: Number,
      min: 1,
      max: 31
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'modified'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modificationHistory: [{
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedDate: {
      type: Date,
      default: Date.now
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    },
    reason: String
  }],
  notes: String,
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancellationReason: String,
  isSwapRequest: {
    type: Boolean,
    default: false
  },
  swapRequestDetails: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ employee: 1, date: 1 });
scheduleSchema.index({ department: 1 });
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ 'shift.type': 1 });

// Prevent duplicate schedules for same employee on same date
scheduleSchema.index({ employee: 1, date: 1, status: 1 }, {
  unique: true,
  partialFilterExpression: {
    status: { $in: ['scheduled', 'in-progress'] },
    isCancelled: false
  }
});

// Virtual for shift duration in hours
scheduleSchema.virtual('shiftDuration').get(function() {
  if (this.shift?.startTime && this.shift?.endTime) {
    const [startHour, startMin] = this.shift.startTime.split(':').map(Number);
    const [endHour, endMin] = this.shift.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes - (this.shift.breakDuration || 0);
    return totalMinutes / 60;
  }
  return 0;
});

module.exports = mongoose.model('Schedule', scheduleSchema);