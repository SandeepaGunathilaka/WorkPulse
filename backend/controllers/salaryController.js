const Salary = require('../models/Salary');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Leave = require('../models/Leave');

// @desc    Calculate salary for an employee
// @route   POST /api/salaries/calculate
// @access  Admin/HR
const calculateSalary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    console.log('Calculating salary for:', { employeeId, month, year });

    // Validate employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Block calculation for inactive or terminated employees
    if (['inactive', 'terminated'].includes(employee.employmentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot calculate salary for ${employee.employmentStatus} employee`
      });
    }

    // Check if salary already exists for this month
    const existingSalary = await Salary.findOne({
      employee: employeeId,
      month,
      year
    });

    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: `Salary for ${employee.firstName} ${employee.lastName} for ${month} ${year} already exists`
      });
    }

    // Get working days for the month (simplified - can be enhanced)
    const workingDays = getWorkingDaysInMonth(month, year);

    // Calculate attendance data from schedules and leave records
    const startDate = new Date(year, getMonthNumber(month) - 1, 1);
    const endDate = new Date(year, getMonthNumber(month), 0);

    const schedules = await Schedule.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Get leave records for the month
    const leaveRecords = await Leave.find({
      employee: employeeId,
      status: 'approved',
      $or: [
        {
          startDate: { $gte: startDate, $lte: endDate }
        },
        {
          endDate: { $gte: startDate, $lte: endDate }
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ]
    });

    // Calculate total leave days taken in this month
    let totalLeaveDaysTaken = 0;
    let paidLeaveDays = 0;
    let noPayLeaveDays = 0;

    leaveRecords.forEach(leave => {
      const leaveStart = new Date(Math.max(leave.startDate, startDate));
      const leaveEnd = new Date(Math.min(leave.endDate, endDate));

      if (leaveStart <= leaveEnd) {
        const leaveDaysInMonth = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
        totalLeaveDaysTaken += leaveDaysInMonth;

        // Check if this exceeds monthly allowance
        if (totalLeaveDaysTaken <= employee.monthlyLeaveAllowance) {
          paidLeaveDays += leaveDaysInMonth;
        } else {
          // Calculate excess leave days (no pay)
          const excessDays = totalLeaveDaysTaken - employee.monthlyLeaveAllowance;
          const paidDaysFromThisLeave = Math.max(0, leaveDaysInMonth - excessDays);
          const noPaidDaysFromThisLeave = leaveDaysInMonth - paidDaysFromThisLeave;

          paidLeaveDays += paidDaysFromThisLeave;
          noPayLeaveDays += noPaidDaysFromThisLeave;
        }
      }
    });

    // Calculate overtime hours from schedules
    let overtimeHours = 0;
    schedules.forEach(schedule => {
      // Basic overtime calculation - can be enhanced
      if (schedule.overtime) {
        overtimeHours += schedule.overtime;
      }
    });

    // Get employee's basic salary
    const basicSalary = employee.basicSalary || 100000; // Use basicSalary from employee model

    // Calculate no-pay deduction (1000 per no-pay day)
    const noPayDeduction = noPayLeaveDays * 1000;

    // Auto-calculated values
    const calculatedData = {
      employeeInfo: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation || employee.role,
        epfNo: employee.epfNo || `${employee.employeeId}/01`,
        bankName: employee.bankDetails?.bankName || 'Please Update Bank Details',
        accountNo: employee.bankDetails?.accountNo || '000000000',
        branchName: employee.bankDetails?.branchName || 'Please Update Branch'
      },
      attendance: {
        workingDays,
        overtimeHours,
        leaveAllowed: employee.monthlyLeaveAllowance || 3,
        noPayLeave: noPayLeaveDays,
        leaveTaken: totalLeaveDaysTaken,
        paidLeaveDays: paidLeaveDays,
        excessLeaveDays: Math.max(0, totalLeaveDaysTaken - (employee.monthlyLeaveAllowance || 3))
      },
      basicSalary,
      allowances: {
        costOfLiving: Math.round(basicSalary * 0.25), // 2.5% of basic salary
        food: 6000,
        conveyance: 3500,
        medical: 8000
      },
      additionalPerks: {
        overtime: 0, // Will be calculated in pre-save
        reimbursements: 0, // HR will input
        bonus: 0 // HR will input
      },
      deductions: {
        salaryAdvance: 0, // HR will input
        apit: 0, // Will be calculated based on salary
        noPayDaysDeduction: noPayDeduction // Fixed at 1000 per no-pay day
      },
      // EPF Information
      epfInfo: {
        epfNo: employee.epfNo,
        joiningDate: employee.epfJoiningDate,
        basicSalaryForEpf: basicSalary
      }
    };

    console.log('Calculated data:', calculatedData);

    res.json({
      success: true,
      data: calculatedData,
      message: 'Salary calculation completed'
    });

  } catch (error) {
    console.error('Calculate salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create/Save salary record
// @route   POST /api/salaries
// @access  Admin/HR
const createSalary = async (req, res) => {
  try {
    const salaryData = {
      ...req.body,
      preparedBy: req.user._id
    };

    console.log('Creating salary with data:', salaryData);

    // Validate employee and employment status before creating salary
    const employee = await User.findById(salaryData.employee);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (['inactive', 'terminated'].includes(employee.employmentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot create salary for ${employee.employmentStatus} employee`
      });
    }

    const salary = await Salary.create(salaryData);
    await salary.populate('employee', 'firstName lastName employeeId');
    await salary.populate('preparedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: salary,
      message: 'Salary record created successfully'
    });

  } catch (error) {
    console.error('Create salary error:', error);

    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      const keys = Object.keys(error.keyValue);
      return res.status(400).json({
        success: false,
        message: `Salary record already exists for this employee and month`,
        error: 'Duplicate salary record'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all salary records
// @route   GET /api/salaries
// @access  Admin/HR
const getAllSalaries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      month,
      year,
      employee,
      status
    } = req.query;

    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    if (employee) filter.employee = employee;
    if (status) filter.status = status;

    const salaries = await Salary.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('preparedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Salary.countDocuments(filter);

    res.json({
      success: true,
      data: salaries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get employee's salary history
// @route   GET /api/salaries/my-salaries
// @access  Employee
const getMySalaries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      year
    } = req.query;

    const filter = { employee: req.user._id };
    if (year) filter.year = parseInt(year);

    const salaries = await Salary.find(filter)
      .populate('preparedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Salary.countDocuments(filter);

    res.json({
      success: true,
      data: salaries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get my salaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get salary by ID
// @route   GET /api/salaries/:id
// @access  Admin/HR/Employee (own records only)
const getSalaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.findById(id)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('preparedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    // Check if employee is accessing their own record
    if (req.user.role === 'employee' && salary.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: salary
    });

  } catch (error) {
    console.error('Get salary by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update salary record
// @route   PUT /api/salaries/:id
// @access  Admin/HR
const updateSalary = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.findById(id);
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    // Don't allow updating if already approved/paid
    if (salary.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update salary record that has been paid'
      });
    }

    const updatedSalary = await Salary.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId')
     .populate('preparedBy', 'firstName lastName')
     .populate('approvedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedSalary,
      message: 'Salary record updated successfully'
    });

  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete salary record
// @route   DELETE /api/salaries/:id
// @access  Admin/HR
const deleteSalary = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.findById(id);
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    // Don't allow deleting if already paid
    if (salary.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete salary record that has been paid'
      });
    }

    await Salary.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Salary record deleted successfully'
    });

  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Approve salary record
// @route   PUT /api/salaries/:id/approve
// @access  Admin/HR
const approveSalary = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('employee', 'firstName lastName employeeId')
     .populate('preparedBy', 'firstName lastName')
     .populate('approvedBy', 'firstName lastName');

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    res.json({
      success: true,
      data: salary,
      message: 'Salary record approved successfully'
    });

  } catch (error) {
    console.error('Approve salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get salary statistics
// @route   GET /api/salary/stats
// @access  Admin/HR
const getSalaryStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};

    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);

    const totalSalaries = await Salary.countDocuments(filter);
    const approvedSalaries = await Salary.countDocuments({ ...filter, status: 'approved' });
    const pendingSalaries = await Salary.countDocuments({ ...filter, status: 'pending' });
    const paidSalaries = await Salary.countDocuments({ ...filter, status: 'paid' });

    // Calculate total payroll amount
    const payrollAggregation = await Salary.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: '$netSalary' },
          totalBasicSalary: { $sum: '$basicSalary' }
        }
      }
    ]);

    const payrollData = payrollAggregation[0] || { totalPayroll: 0, totalBasicSalary: 0 };

    // Department-wise salary distribution
    const departmentStats = await Salary.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' },
      {
        $group: {
          _id: '$employeeData.department',
          totalEmployees: { $sum: 1 },
          totalSalary: { $sum: '$netSalary' },
          avgSalary: { $avg: '$netSalary' }
        }
      }
    ]);

    // Status distribution
    const statusStats = await Salary.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$netSalary' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalSalaries,
        approvedSalaries,
        pendingSalaries,
        paidSalaries,
        totalPayroll: payrollData.totalPayroll,
        totalBasicSalary: payrollData.totalBasicSalary,
        departmentStats,
        statusStats
      }
    });
  } catch (error) {
    console.error('Get salary stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Helper functions
const getWorkingDaysInMonth = (month, year) => {
  const monthNumber = getMonthNumber(month);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  // This is simplified - in reality, you'd exclude weekends and holidays
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNumber - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
      workingDays++;
    }
  }

  return workingDays;
};

const getMonthNumber = (monthName) => {
  const months = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  return months[monthName] || 1;
};

module.exports = {
  calculateSalary,
  createSalary,
  getAllSalaries,
  getMySalaries,
  getSalaryById,
  updateSalary,
  deleteSalary,
  approveSalary,
  getSalaryStats
};