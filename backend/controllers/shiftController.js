const Shift = require('../models/Shift');
const User = require('../models/User');

// Create a new shift
const createShift = async (req, res) => {
  try {
    const { employee, date, startTime, endTime, shiftType, department, notes } = req.body;

    // Validate employee exists
    const employeeUser = await User.findById(employee);
    if (!employeeUser) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check for shift conflicts
    const existingShift = await Shift.findOne({
      employee,
      date: new Date(date),
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        },
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime }
        }
      ]
    });

    if (existingShift) {
      return res.status(400).json({
        success: false,
        message: 'Employee already has a shift scheduled during this time'
      });
    }

    const shift = new Shift({
      employee,
      date,
      startTime,
      endTime,
      shiftType,
      department,
      notes,
      createdBy: req.user._id
    });

    await shift.save();
    await shift.populate('employee', 'firstName lastName email department');

    res.status(201).json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating shift',
      error: error.message
    });
  }
};

// Get all shifts with filtering
const getShifts = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      employee,
      department,
      status,
      page = 1,
      limit = 50
    } = req.query;

    let query = {};

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Other filters
    if (employee) query.employee = employee;
    if (department) query.department = department;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const shifts = await Shift.find(query)
      .populate('employee', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName email')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Shift.countDocuments(query);

    res.json({
      success: true,
      data: shifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shifts',
      error: error.message
    });
  }
};

// Get shifts for a specific employee
const getEmployeeShifts = async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user._id;
    const { startDate, endDate } = req.query;

    let query = { employee: employeeId };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const shifts = await Shift.find(query)
      .populate('employee', 'firstName lastName email department')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: shifts
    });
  } catch (error) {
    console.error('Error fetching employee shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee shifts',
      error: error.message
    });
  }
};

// Get shift by ID
const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('employee', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName email');

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shift',
      error: error.message
    });
  }
};

// Update shift
const updateShift = async (req, res) => {
  try {
    const { employee, date, startTime, endTime, shiftType, department, notes, status } = req.body;

    // Check for shift conflicts if updating time or date
    if (employee || date || startTime || endTime) {
      const conflictQuery = {
        _id: { $ne: req.params.id },
        employee: employee || undefined,
        date: date ? new Date(date) : undefined
      };

      // Remove undefined values
      Object.keys(conflictQuery).forEach(key =>
        conflictQuery[key] === undefined && delete conflictQuery[key]
      );

      if (startTime && endTime && Object.keys(conflictQuery).length > 1) {
        conflictQuery.$or = [
          {
            startTime: { $lte: startTime },
            endTime: { $gt: startTime }
          },
          {
            startTime: { $lt: endTime },
            endTime: { $gte: endTime }
          },
          {
            startTime: { $gte: startTime },
            endTime: { $lte: endTime }
          }
        ];

        const conflictingShift = await Shift.findOne(conflictQuery);
        if (conflictingShift) {
          return res.status(400).json({
            success: false,
            message: 'Employee already has a shift scheduled during this time'
          });
        }
      }
    }

    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      { employee, date, startTime, endTime, shiftType, department, notes, status },
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName email department');

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shift',
      error: error.message
    });
  }
};

// Delete shift
const deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting shift',
      error: error.message
    });
  }
};

// Get shift statistics
const getShiftStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const stats = await Shift.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalShifts: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: [
                  { $dateFromString: { dateString: { $concat: ["2000-01-01T", "$endTime"] } } },
                  { $dateFromString: { dateString: { $concat: ["2000-01-01T", "$startTime"] } } }
                ]},
                3600000 // Convert milliseconds to hours
              ]
            }
          },
          departmentBreakdown: {
            $push: "$department"
          },
          statusBreakdown: {
            $push: "$status"
          }
        }
      }
    ]);

    // Get department and status counts
    const departmentStats = await Shift.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = await Shift.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { totalShifts: 0, totalHours: 0 },
        departmentBreakdown: departmentStats,
        statusBreakdown: statusStats
      }
    });
  } catch (error) {
    console.error('Error fetching shift statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shift statistics',
      error: error.message
    });
  }
};

module.exports = {
  createShift,
  getShifts,
  getEmployeeShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getShiftStats
};