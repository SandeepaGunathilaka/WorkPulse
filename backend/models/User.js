const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee'],
    default: 'employee'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  employmentStatus: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on-leave'],
    default: 'active'
  },
  profilePicture: {
    type: String,
    default: null
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  passwordSet: {
    type: Boolean,
    default: true
  },

  // Salary Information
  basicSalary: {
    type: Number,
    default: 0,
    min: 0
  },
  salaryGrade: {
    type: String,
    default: 'Grade-1'
  },

  // EPF Information
  epfNo: {
    type: String,
    trim: true
  },
  epfJoiningDate: {
    type: Date
  },

  // Bank Details
  bankDetails: {
    bankName: {
      type: String,
      trim: true
    },
    accountNo: {
      type: String,
      trim: true
    },
    branchName: {
      type: String,
      trim: true
    },
    branchCode: {
      type: String,
      trim: true
    }
  },

  // Leave Configuration
  leaveAllowance: {
    annual: {
      type: Number,
      default: 21 // Annual leave days per year
    },
    casual: {
      type: Number,
      default: 7 // Casual leave days per year
    },
    sick: {
      type: Number,
      default: 7 // Sick leave days per year
    },
    maternity: {
      type: Number,
      default: 84 // Maternity leave days (applicable for female employees)
    },
    paternity: {
      type: Number,
      default: 3 // Paternity leave days (applicable for male employees)
    }
  },

  // Monthly Leave Allowance (for salary deduction calculation)
  monthlyLeaveAllowance: {
    type: Number,
    default: 3 // Default 3 days per month
  }
}, {
  timestamps: true
});

// Index for performance (unique fields already have automatic indexes)
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);