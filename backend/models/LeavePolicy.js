const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: '📋'
  },
  color: {
    type: String,
    default: 'bg-gray-500'
  },
  description: {
    type: String,
    required: true
  },
  annualAllocation: {
    type: Number,
    required: true,
    min: 0
  },
  maxConsecutiveDays: {
    type: Number,
    required: true,
    min: 1
  },
  requiresMedicalCertificate: {
    type: Boolean,
    default: false
  },
  medicalCertificateAfterDays: {
    type: Number,
    default: null
  },
  carryForward: {
    type: Boolean,
    default: false
  },
  maxCarryForward: {
    type: Number,
    default: 0
  },
  encashable: {
    type: Boolean,
    default: false
  },
  rules: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for performance
leavePolicySchema.index({ type: 1 });
leavePolicySchema.index({ isActive: 1 });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);