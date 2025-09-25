const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendPasswordNotificationEmail, sendWelcomeEmail } = require('../services/emailService');

// Helper function to generate employee ID
const generateEmployeeId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `EMP${currentYear}`;

  // Find the latest employee ID for current year
  const latestEmployee = await User.findOne({
    employeeId: { $regex: `^${prefix}` }
  }).sort({ employeeId: -1 });

  let nextNumber = 1;
  if (latestEmployee) {
    const lastNumber = parseInt(latestEmployee.employeeId.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  HR/Admin
const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, role, status, search } = req.query;

    const filter = {};

    // Apply filters
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (status) filter.employmentStatus = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(filter)
      .select('-password -twoFactorSecret -resetPasswordToken')
      .sort({ createdAt: -1, joiningDate: -1, _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);


    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: employees,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  HR/Admin/Employee (own data)
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password -twoFactorSecret -resetPasswordToken');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if user can access this employee data
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  HR/Admin
const createEmployee = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      department,
      designation,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      role = 'employee'
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId();

    // Generate temporary password or use provided password
    let password = req.body.password;
    let passwordSet = req.body.passwordSet !== false; // Default to true unless explicitly set to false

    if (!password) {
      // If no password provided (HR registration), generate temporary password
      password = Math.random().toString(36).slice(-12);
      passwordSet = false; // Mark that admin needs to set proper password
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee
    const employee = await User.create({
      employeeId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      department,
      designation,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      role,
      joiningDate: new Date(),
      employmentStatus: 'active',
      isActive: true,
      passwordSet: passwordSet // Track if admin needs to set password
    });

    // Send welcome email to new employee (if registered by HR without password)
    if (!passwordSet) {
      try {
        await sendWelcomeEmail(employee);
        console.log(`Welcome email sent to ${employee.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the employee creation if email fails
      }
    }

    res.status(201).json({
      success: true,
      data: {
        employee: employee.toJSON(),
        ...(passwordSet ? {} : { tempPassword: password })
      },
      message: 'Employee created successfully' + (!passwordSet ? ' and welcome email sent' : '')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  HR/Admin
const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }

    // Update employee
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -resetPasswordToken');

    res.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  HR/Admin
const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Prevent deletion of admin users
    if (employee.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  HR/Admin
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments();
    const activeEmployees = await User.countDocuments({ employmentStatus: 'active' });
    const inactiveEmployees = await User.countDocuments({ employmentStatus: 'inactive' });

    const departmentStats = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        departmentStats,
        roleStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate new employee ID
// @route   GET /api/employees/generate-id
// @access  HR/Admin
const generateEmployeeIdEndpoint = async (req, res) => {
  try {
    const employeeId = await generateEmployeeId();
    res.json({
      success: true,
      data: { employeeId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Set/Reset employee password
// @route   PUT /api/employees/:id/password
// @access  Admin only
const setEmployeePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update the password (will be hashed by pre-save hook in User model)
    employee.password = newPassword;
    employee.passwordSet = true;
    await employee.save();

    // Send email notification to employee with login credentials
    try {
      await sendPasswordNotificationEmail(employee, newPassword);
      console.log(`Password notification email sent to ${employee.email}`);
    } catch (emailError) {
      console.error('Failed to send password notification email:', emailError);
      // Don't fail the password update if email fails
    }

    res.json({
      success: true,
      message: 'Password updated successfully and notification email sent to employee'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update employee salary and EPF details
// @route   PUT /api/employees/:id/salary
// @access  HR/Admin
const updateEmployeeSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      basicSalary,
      salaryGrade,
      epfNo,
      epfJoiningDate,
      bankDetails,
      monthlyLeaveAllowance,
      leaveAllowance
    } = req.body;

    console.log('Updating salary for employee:', id);
    console.log('Salary data:', req.body);

    const updateData = {};

    // Update salary information
    if (basicSalary !== undefined) updateData.basicSalary = basicSalary;
    if (salaryGrade !== undefined) updateData.salaryGrade = salaryGrade;

    // Update EPF information
    if (epfNo !== undefined) updateData.epfNo = epfNo;
    if (epfJoiningDate !== undefined) updateData.epfJoiningDate = epfJoiningDate;

    // Update bank details
    if (bankDetails !== undefined) updateData.bankDetails = bankDetails;

    // Update leave allowance
    if (monthlyLeaveAllowance !== undefined) updateData.monthlyLeaveAllowance = monthlyLeaveAllowance;
    if (leaveAllowance !== undefined) updateData.leaveAllowance = leaveAllowance;

    const employee = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -resetPasswordToken');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'Employee salary details updated successfully'
    });

  } catch (error) {
    console.error('Update employee salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  generateEmployeeIdEndpoint,
  setEmployeePassword,
  updateEmployeeSalary
};