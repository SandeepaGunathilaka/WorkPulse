const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const LeavePolicy = require('../models/LeavePolicy');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Employee
const applyLeave = async (req, res) => {
  try {
    const {
      type,
      startDate,
      endDate,
      reason,
      emergencyContact,
      isHalfDay,
      halfDayType
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Leave start date cannot be in the past'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date'
      });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employee: req.user._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for overlapping dates'
      });
    }

    // Calculate total days
    let totalDays;
    if (isHalfDay) {
      totalDays = 0.5;
    } else {
      const timeDiff = end.getTime() - start.getTime();
      totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }

    // Debug user object
    console.log('🔍 User object:', {
      id: req.user._id,
      department: req.user.department,
      role: req.user.role,
      firstName: req.user.firstName
    });

    const leaveData = {
      employee: req.user._id,
      type,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      emergencyContact,
      isHalfDay,
      halfDayType,
      status: 'pending',
      appliedDate: new Date(),
      department: req.user.department || req.user.role || 'General'
    };

    const leave = await Leave.create(leaveData);
    await leave.populate('employee', 'firstName lastName employeeId department');

    res.status(201).json({
      success: true,
      data: leave,
      message: 'Leave application submitted successfully'
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all leave requests (Admin/HR)
// @route   GET /api/leaves
// @access  Admin/HR
const getAllLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      department,
      employeeId,
      startDate,
      endDate,
      search
    } = req.query;

    const filter = {};

    // Status filter
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Employee filters
    let userFilter = {};
    if (department) userFilter.department = department;
    if (employeeId) userFilter.employeeId = { $regex: employeeId, $options: 'i' };
    if (search) {
      userFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // If user filters exist, get matching user IDs
    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter).select('_id');
      filter.employee = { $in: users.map(u => u._id) };
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ appliedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments(filter);

    res.json({
      success: true,
      data: leaves,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get my leave requests
// @route   GET /api/leaves/my-leaves
// @access  Employee
const getMyLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      year
    } = req.query;

    const filter = { employee: req.user._id };

    if (status) filter.status = status;
    if (type) filter.type = type;

    // Year filter
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      filter.startDate = {
        $gte: startOfYear,
        $lte: endOfYear
      };
    }

    const leaves = await Leave.find(filter)
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ appliedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments(filter);

    // Calculate leave summary
    const summary = await Leave.aggregate([
      { $match: { employee: req.user._id } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          approvedLeaves: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pendingLeaves: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          rejectedLeaves: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          totalDaysUsed: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$totalDays', 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: leaves,
      summary: summary[0] || {
        totalRequests: 0,
        approvedLeaves: 0,
        pendingLeaves: 0,
        rejectedLeaves: 0,
        totalDaysUsed: 0
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Approve leave request
// @route   PUT /api/leaves/:id/approve
// @access  Admin/HR
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been processed'
      });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedDate = new Date();
    leave.remarks = remarks;

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId');
    await leave.populate('approvedBy', 'firstName lastName');

    res.json({
      success: true,
      data: leave,
      message: 'Leave request approved successfully'
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Reject leave request
// @route   PUT /api/leaves/:id/reject
// @access  Admin/HR
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been processed'
      });
    }

    leave.status = 'rejected';
    leave.rejectedBy = req.user._id;
    leave.rejectedDate = new Date();
    leave.remarks = remarks;

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId');
    await leave.populate('rejectedBy', 'firstName lastName');

    res.json({
      success: true,
      data: leave,
      message: 'Leave request rejected successfully'
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update leave request
// @route   PUT /api/leaves/:id
// @access  Employee (only pending leaves)
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user owns this leave request
    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own leave requests'
      });
    }

    // Only allow updates for pending leaves
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You can only update pending leave requests'
      });
    }

    // Recalculate total days if dates changed
    if (updateData.startDate || updateData.endDate || updateData.isHalfDay) {
      const start = new Date(updateData.startDate || leave.startDate);
      const end = new Date(updateData.endDate || leave.endDate);

      if (updateData.isHalfDay !== undefined ? updateData.isHalfDay : leave.isHalfDay) {
        updateData.totalDays = 0.5;
      } else {
        const timeDiff = end.getTime() - start.getTime();
        updateData.totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      }
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId');

    res.json({
      success: true,
      data: updatedLeave,
      message: 'Leave request updated successfully'
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Cancel leave request
// @route   DELETE /api/leaves/:id
// @access  Employee (only pending leaves)
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user owns this leave request
    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests'
      });
    }

    // Only allow cancellation for pending leaves
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You can only cancel pending leave requests'
      });
    }

    leave.status = 'cancelled';
    leave.cancelledDate = new Date();
    await leave.save();

    res.json({
      success: true,
      message: 'Leave request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Admin/HR
const getLeaveStats = async (req, res) => {
  try {
    console.log('📊📊📊 LEAVE STATS ENDPOINT CALLED 📊📊📊');
    console.log('Query params:', req.query);
    const { startDate, endDate, department } = req.query;

    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Department filter through user lookup
    let userFilter = {};
    if (department) userFilter.department = department;

    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter).select('_id');
      filter.employee = { $in: users.map(u => u._id) };
    }

    const stats = await Leave.aggregate([
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
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          totalDaysRequested: { $sum: '$totalDays' },
          totalDaysApproved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$totalDays', 0] }
          },
          sickLeaves: {
            $sum: { $cond: [{ $eq: ['$type', 'sick'] }, 1, 0] }
          },
          casualLeaves: {
            $sum: { $cond: [{ $eq: ['$type', 'casual'] }, 1, 0] }
          },
          annualLeaves: {
            $sum: { $cond: [{ $eq: ['$type', 'annual'] }, 1, 0] }
          },
          emergencyLeaves: {
            $sum: { $cond: [{ $eq: ['$type', 'emergency'] }, 1, 0] }
          },
          maternityLeaves: {
            $sum: { $cond: [{ $eq: ['$type', 'maternity'] }, 1, 0] }
          },
          paternityLeaves: {
            $sum: { $cond: [{ $eq: ['$type', 'paternity'] }, 1, 0] }
          }
        }
      }
    ]);

    // Department-wise statistics
    const departmentStats = await Leave.aggregate([
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
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          totalDaysApproved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$totalDays', 0] }
          }
        }
      }
    ]);

    // Monthly trend
    const monthlyTrend = await Leave.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$appliedDate' },
            month: { $month: '$appliedDate' }
          },
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const overallStats = stats[0] || {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalDaysRequested: 0,
      totalDaysApproved: 0,
      sickLeaves: 0,
      casualLeaves: 0,
      annualLeaves: 0,
      emergencyLeaves: 0,
      maternityLeaves: 0,
      paternityLeaves: 0
    };

    // Calculate additional fields
    const averageLeaveLength = overallStats.totalRequests > 0
      ? (overallStats.totalDaysRequested / overallStats.totalRequests).toFixed(1)
      : 0;

    const approvalRate = overallStats.totalRequests > 0
      ? ((overallStats.approvedRequests / overallStats.totalRequests) * 100).toFixed(1)
      : 0;

    // Calculate monthly increase (compare last 2 months if data exists)
    let monthlyIncrease = 0;
    if (monthlyTrend.length >= 2) {
      const currentMonth = monthlyTrend[0].totalRequests;
      const previousMonth = monthlyTrend[1].totalRequests;
      monthlyIncrease = previousMonth > 0
        ? (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1)
        : 0;
    }

    const responseData = {
      overall: {
        ...overallStats,
        averageLeaveLength: parseFloat(averageLeaveLength)
      },
      trends: {
        monthlyIncrease: parseFloat(monthlyIncrease),
        approvalRate: parseFloat(approvalRate),
        averageProcessingTime: 2.5 // Default placeholder - could be calculated from approval dates
      },
      departmentWise: departmentStats,
      monthlyTrend
    };

    console.log('✅ Leave stats retrieved:', JSON.stringify(responseData, null, 2));

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get leave balance for employee
// @route   GET /api/leaves/balance
// @access  Employee
const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    // Get user to check join date and calculate entitlement
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate leave entitlement based on tenure
    const joinDate = new Date(user.joiningDate);
    const currentDate = new Date();
    const tenure = (currentDate - joinDate) / (1000 * 60 * 60 * 24 * 365); // in years

    // Default leave entitlements (customize as needed)
    const entitlements = {
      annual: Math.floor(tenure) >= 1 ? 21 : Math.floor(tenure * 21),
      sick: 14,
      casual: 7,
      emergency: 3
    };

    // Get approved leaves for current year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const usedLeaves = await Leave.aggregate([
      {
        $match: {
          employee: userId,
          status: 'approved',
          startDate: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: '$type',
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    // Calculate remaining balance
    const balance = {
      annual: {
        entitled: entitlements.annual,
        used: 0,
        remaining: entitlements.annual
      },
      sick: {
        entitled: entitlements.sick,
        used: 0,
        remaining: entitlements.sick
      },
      casual: {
        entitled: entitlements.casual,
        used: 0,
        remaining: entitlements.casual
      },
      emergency: {
        entitled: entitlements.emergency,
        used: 0,
        remaining: entitlements.emergency
      },
      maternity: {
        entitled: 90,
        used: 0,
        remaining: 90
      },
      paternity: {
        entitled: 14,
        used: 0,
        remaining: 14
      }
    };

    usedLeaves.forEach(leave => {
      if (balance[leave._id]) {
        balance[leave._id].used = leave.totalDays;
        balance[leave._id].remaining = balance[leave._id].entitled - leave.totalDays;
      }
    });

    res.json({
      success: true,
      data: {
        year: currentYear,
        tenure: Math.round(tenure * 10) / 10, // Round to 1 decimal
        balance
      }
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all employee leave balances (Admin/HR)
// @route   GET /api/leaves/admin/balances
// @access  Admin/HR
const getAllLeaveBalances = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, search } = req.query;

    let userFilter = {};
    if (department) userFilter.department = department;
    if (search) {
      userFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(userFilter)
      .select('_id firstName lastName employeeId department joiningDate')
      .sort({ firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const currentYear = new Date().getFullYear();
    const balances = [];

    for (const user of users) {
      let balance = await LeaveBalance.findOne({
        employee: user._id,
        year: currentYear
      });

      if (!balance) {
        // Create default balance if not exists
        const joinDate = new Date(user.joiningDate);
        const tenure = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 365);

        const defaultLeaveTypes = [
          { type: 'annual', allocated: Math.floor(tenure) >= 1 ? 21 : Math.floor(tenure * 21), used: 0, pending: 0 },
          { type: 'sick', allocated: 14, used: 0, pending: 0 },
          { type: 'casual', allocated: 7, used: 0, pending: 0 },
          { type: 'emergency', allocated: 3, used: 0, pending: 0 },
          { type: 'maternity', allocated: 90, used: 0, pending: 0 },
          { type: 'paternity', allocated: 14, used: 0, pending: 0 }
        ];

        balance = new LeaveBalance({
          employee: user._id,
          year: currentYear,
          leaveTypes: defaultLeaveTypes,
          department: user.department
        });
        await balance.save();
      }

      balances.push({
        employee: user,
        balance: balance.leaveTypes,
        year: currentYear,
        lastUpdated: balance.lastUpdated
      });
    }

    const total = await User.countDocuments(userFilter);

    res.json({
      success: true,
      data: balances,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all leave balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update employee leave balance (Admin/HR)
// @route   PUT /api/leaves/admin/balances/:employeeId
// @access  Admin/HR
const updateLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear(), leaveTypes } = req.body;

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    let balance = await LeaveBalance.findOne({
      employee: employeeId,
      year: year
    });

    if (!balance) {
      balance = new LeaveBalance({
        employee: employeeId,
        year: year,
        leaveTypes: [],
        department: user.department
      });
    }

    // Update leave types
    leaveTypes.forEach(newLeaveType => {
      const existingIndex = balance.leaveTypes.findIndex(lt => lt.type === newLeaveType.type);
      if (existingIndex >= 0) {
        balance.leaveTypes[existingIndex] = { ...balance.leaveTypes[existingIndex], ...newLeaveType };
      } else {
        balance.leaveTypes.push(newLeaveType);
      }
    });

    await balance.save();

    res.json({
      success: true,
      data: balance,
      message: 'Leave balance updated successfully'
    });
  } catch (error) {
    console.error('Update leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create leave policy
// @route   POST /api/leaves/admin/policies
// @access  Admin
const createLeavePolicy = async (req, res) => {
  try {
    const {
      name,
      type,
      icon,
      color,
      description,
      annualAllocation,
      maxConsecutiveDays,
      requiresMedicalCertificate,
      medicalCertificateAfterDays,
      carryForward,
      maxCarryForward,
      encashable,
      rules
    } = req.body;

    // Check if policy type already exists
    const existingPolicy = await LeavePolicy.findOne({ type });
    if (existingPolicy) {
      return res.status(400).json({
        success: false,
        message: 'Leave policy with this type already exists'
      });
    }

    const policy = new LeavePolicy({
      name,
      type,
      icon,
      color,
      description,
      annualAllocation,
      maxConsecutiveDays,
      requiresMedicalCertificate,
      medicalCertificateAfterDays,
      carryForward,
      maxCarryForward,
      encashable,
      rules,
      createdBy: req.user._id
    });

    await policy.save();

    res.status(201).json({
      success: true,
      message: 'Leave policy created successfully',
      data: policy
    });
  } catch (error) {
    console.error('Create leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get leave policies
// @route   GET /api/leaves/admin/policies
// @access  Admin/HR
const getLeavePolicies = async (req, res) => {
  try {
    const { isActive } = req.query;

    let filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const policies = await LeavePolicy.find(filter)
      .populate({
        path: 'createdBy',
        select: 'firstName lastName',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'updatedBy',
        select: 'firstName lastName',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('❌ Get leave policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update leave policy
// @route   PUT /api/leaves/admin/policies/:id
// @access  Admin
const updateLeavePolicy = async (req, res) => {
  try {
    const policyId = req.params.id;
    const updateData = { ...req.body, updatedBy: req.user._id };

    // Check if policy exists
    const policy = await LeavePolicy.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Leave policy not found'
      });
    }

    // Check if updating type and it conflicts with existing
    if (updateData.type && updateData.type !== policy.type) {
      const existingPolicy = await LeavePolicy.findOne({
        type: updateData.type,
        _id: { $ne: policyId }
      });
      if (existingPolicy) {
        return res.status(400).json({
          success: false,
          message: 'Leave policy with this type already exists'
        });
      }
    }

    const updatedPolicy = await LeavePolicy.findByIdAndUpdate(
      policyId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Leave policy updated successfully',
      data: updatedPolicy
    });
  } catch (error) {
    console.error('Update leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete leave policy
// @route   DELETE /api/leaves/admin/policies/:id
// @access  Admin
const deleteLeavePolicy = async (req, res) => {
  try {
    const policyId = req.params.id;

    const policy = await LeavePolicy.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Leave policy not found'
      });
    }

    await LeavePolicy.findByIdAndDelete(policyId);

    res.json({
      success: true,
      message: 'Leave policy deleted successfully'
    });
  } catch (error) {
    console.error('Delete leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  approveLeave,
  rejectLeave,
  updateLeave,
  cancelLeave,
  getLeaveStats,
  getLeaveBalance,
  getAllLeaveBalances,
  updateLeaveBalance,
  createLeavePolicy,
  getLeavePolicies,
  updateLeavePolicy,
  deleteLeavePolicy
};