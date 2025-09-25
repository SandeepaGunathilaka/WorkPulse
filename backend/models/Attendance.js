const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    qrCode: String,
    method: {
      type: String,
      enum: ['qr', 'manual', 'biometric', 'web'],
      default: 'web'
    }
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    method: {
      type: String,
      enum: ['qr', 'manual', 'biometric', 'web'],
      default: 'web'
    }
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    type: {
      type: String,
      enum: ['lunch', 'tea', 'personal', 'other'],
      default: 'other'
    }
  }],
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'holiday', 'weekend', 'on-leave'],
    default: 'present'
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  workHours: {
    type: Number, // Total work hours in minutes
    default: 0
  },
  overtime: {
    type: Number, // Overtime in minutes
    default: 0
  },
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  manualEntryReason: String
}, {
  timestamps: true
});

// Compound index for unique attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Calculate work hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn?.time && this.checkOut?.time) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);

    let totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);

    // Subtract break time
    if (this.breaks && this.breaks.length > 0) {
      const breakMinutes = this.breaks.reduce((total, breakItem) => {
        if (breakItem.endTime && breakItem.startTime) {
          return total + (new Date(breakItem.endTime) - new Date(breakItem.startTime)) / (1000 * 60);
        }
        return total;
      }, 0);
      totalMinutes -= breakMinutes;
    }

    this.workHours = Math.max(0, totalMinutes);

    // Calculate overtime (assuming 8 hours standard work day)
    const standardWorkMinutes = 8 * 60; // 8 hours
    if (this.workHours > standardWorkMinutes) {
      this.overtime = this.workHours - standardWorkMinutes;
    }
  }

  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);