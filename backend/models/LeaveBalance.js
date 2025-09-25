const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  leaveTypes: [{
    type: {
      type: String,
      enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'emergency', 'study'],
      required: true
    },
    allocated: {
      type: Number,
      required: true,
      min: 0
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0,
      min: 0
    },
    available: {
      type: Number,
      default: 0
    },
    carriedForward: {
      type: Number,
      default: 0,
      min: 0
    },
    maxCarryForward: {
      type: Number,
      default: 0
    },
    expiryDate: Date
  }],
  department: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: String
}, {
  timestamps: true
});

// Compound index for unique leave balance per employee per year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });
leaveBalanceSchema.index({ department: 1 });

// Calculate available leave before saving
leaveBalanceSchema.pre('save', function(next) {
  this.leaveTypes.forEach(leave => {
    leave.available = leave.allocated + leave.carriedForward - leave.used - leave.pending;
  });
  this.lastUpdated = new Date();
  next();
});

// Method to check if employee has sufficient leave balance
leaveBalanceSchema.methods.hassufficientBalance = function(leaveType, days) {
  const leave = this.leaveTypes.find(l => l.type === leaveType);
  return leave && leave.available >= days;
};

// Method to deduct leave
leaveBalanceSchema.methods.deductLeave = function(leaveType, days) {
  const leave = this.leaveTypes.find(l => l.type === leaveType);
  if (leave && leave.available >= days) {
    leave.used += days;
    leave.available = leave.allocated + leave.carriedForward - leave.used - leave.pending;
    return true;
  }
  return false;
};

// Method to add pending leave
leaveBalanceSchema.methods.addPendingLeave = function(leaveType, days) {
  const leave = this.leaveTypes.find(l => l.type === leaveType);
  if (leave) {
    leave.pending += days;
    leave.available = leave.allocated + leave.carriedForward - leave.used - leave.pending;
    return true;
  }
  return false;
};

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);