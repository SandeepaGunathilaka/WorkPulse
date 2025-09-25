const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    enum: ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December']
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },

  // Employee Information
  employeeInfo: {
    employeeId: String,
    name: String,
    designation: String,
    epfNo: String,
    bankName: String,
    accountNo: String,
    branchName: String
  },

  // Attendance Information
  attendance: {
    workingDays: {
      type: Number,
      required: true,
      default: 31
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    leaveAllowed: {
      type: Number,
      default: 3
    },
    noPayLeave: {
      type: Number,
      default: 0
    },
    leaveTaken: {
      type: Number,
      default: 0
    },
    paidLeaveDays: {
      type: Number,
      default: 0
    },
    excessLeaveDays: {
      type: Number,
      default: 0
    }
  },

  // Salary Calculations
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },

  // Allowances
  allowances: {
    costOfLiving: {
      type: Number,
      default: 25000
    },
    food: {
      type: Number,
      default: 6000
    },
    conveyance: {
      type: Number,
      default: 3500
    },
    medical: {
      type: Number,
      default: 8000
    },
    total: {
      type: Number,
      default: 0
    }
  },

  // Additional Perks
  additionalPerks: {
    overtime: {
      type: Number,
      default: 0
    },
    reimbursements: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    }
  },

  // Deductions
  deductions: {
    noPayDaysDeduction: {
      type: Number,
      default: 0
    },
    salaryAdvance: {
      type: Number,
      default: 0
    },
    epfEmployee: {
      percentage: {
        type: Number,
        default: 8
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    apit: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },

  // EPF Contributions
  epfContributions: {
    employee: {
      percentage: {
        type: Number,
        default: 8 // Employee EPF contribution (8%)
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    employer: {
      percentage: {
        type: Number,
        default: 12 // Employer EPF contribution (12%)
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    etf: {
      percentage: {
        type: Number,
        default: 3 // ETF contribution (3%)
      },
      amount: {
        type: Number,
        default: 0
      }
    }
  },

  // EPF Information
  epfInfo: {
    epfNo: String,
    joiningDate: Date,
    basicSalaryForEpf: {
      type: Number,
      default: 0
    }
  },

  // Final Calculations
  grossSalary: {
    type: Number,
    default: 0
  },
  salaryBeforeDeduction: {
    type: Number,
    default: 0
  },
  netPayableSalary: {
    type: Number,
    required: true,
    min: 0
  },
  amountInWords: {
    type: String,
    default: ''
  },

  // Approval
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  status: {
    type: String,
    enum: ['draft', 'approved', 'paid'],
    default: 'draft'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound unique index to prevent duplicate salary records
salarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Virtual for daily salary calculation
salarySchema.virtual('dailySalary').get(function() {
  return this.basicSalary / this.attendance.workingDays;
});

// Pre-save middleware to calculate totals
salarySchema.pre('save', function(next) {
  // Calculate allowances total
  this.allowances.total =
    this.allowances.costOfLiving +
    this.allowances.food +
    this.allowances.conveyance +
    this.allowances.medical;

  // Calculate gross salary
  this.grossSalary = this.basicSalary + this.allowances.total;

  // Calculate no pay days deduction
  const dailySalary = this.basicSalary / this.attendance.workingDays;
  this.deductions.noPayDaysDeduction = Math.round(1000 * this.attendance.noPayLeave);

  // Calculate overtime pay
  const hourlyRate = this.basicSalary / (this.attendance.workingDays * 8); // Assuming 8 hours per day
  this.additionalPerks.overtime = Math.round(hourlyRate * 1.5 * this.attendance.overtimeHours); // 1.5x rate for overtime

  // Calculate EPF employee contribution (8% of basic salary) - this is a deduction
  this.deductions.epfEmployee.amount = Math.round(this.basicSalary * (this.deductions.epfEmployee.percentage / 100));

  // Calculate EPF contributions (employer pays these, not deducted from employee)
  this.epfContributions.employee.amount = Math.round(this.basicSalary * (this.epfContributions.employee.percentage / 100));
  this.epfContributions.employer.amount = Math.round(this.basicSalary * (this.epfContributions.employer.percentage / 100));
  this.epfContributions.etf.amount = Math.round(this.basicSalary * (this.epfContributions.etf.percentage / 100));

  // Calculate total deductions
  this.deductions.total =
    this.deductions.noPayDaysDeduction +
    this.deductions.salaryAdvance +
    this.deductions.epfEmployee.amount +
    this.deductions.apit;

  // Calculate salary before deduction
  this.salaryBeforeDeduction =
    this.grossSalary +
    this.additionalPerks.overtime +
    this.additionalPerks.reimbursements +
    this.additionalPerks.bonus;

  // Calculate net payable salary
  this.netPayableSalary = this.salaryBeforeDeduction - this.deductions.total;

  // Convert amount to words (simplified - you can use a library for this)
  this.amountInWords = this.convertToWords(this.netPayableSalary);

  // Update timestamp
  this.updatedAt = Date.now();

  next();
});

// Method to convert number to words (simplified version)
salarySchema.methods.convertToWords = function(amount) {
  // This is a simplified version - you can use libraries like 'num-words' for more comprehensive conversion
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (amount === 0) return 'Zero';
  if (amount < 0) return 'Negative ' + this.convertToWords(Math.abs(amount));

  let words = '';

  if (amount >= 100000) {
    const lakhs = Math.floor(amount / 100000);
    words += this.convertToWords(lakhs) + ' Lakh ';
    amount %= 100000;
  }

  if (amount >= 1000) {
    const thousands = Math.floor(amount / 1000);
    words += this.convertToWords(thousands) + ' Thousand ';
    amount %= 1000;
  }

  if (amount >= 100) {
    words += ones[Math.floor(amount / 100)] + ' Hundred ';
    amount %= 100;
  }

  if (amount >= 20) {
    words += tens[Math.floor(amount / 10)] + ' ';
    amount %= 10;
  } else if (amount >= 10) {
    words += teens[amount - 10] + ' ';
    amount = 0;
  }

  if (amount > 0) {
    words += ones[amount] + ' ';
  }

  return words.trim();
};

module.exports = mongoose.model('Salary', salarySchema);