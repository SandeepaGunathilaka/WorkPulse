const Schedule = require('../models/Schedule');
const User = require('../models/User');

// @desc    Create new schedule
// @route   POST /api/schedules
// @access  Admin/HR
const createSchedule = async (req, res) => {
  try {
    const {
      employee,
      date,
      shift,
      department,
      location,
      isRecurring,
      recurringPattern,
      notes
    } = req.body;

    // Validate employee exists
    const employeeExists = await User.findById(employee);
    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check for conflicting schedules
    const conflictingSchedule = await Schedule.findOne({
      employee,
      date: new Date(date),
      status: { $in: ['scheduled', 'in-progress'] },
      isCancelled: false
    });

    if (conflictingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Employee already has a schedule for this date'
      });
    }

    const scheduleData = {
      employee,
      date: new Date(date),
      shift,
      department,
      location,
      isRecurring,
      recurringPattern,
      notes,
      createdBy: req.user._id
    };

    const schedule = await Schedule.create(scheduleData);
    await schedule.populate('employee', 'firstName lastName employeeId department');
    await schedule.populate('createdBy', 'firstName lastName');

    // If recurring, create additional schedules
    if (isRecurring && recurringPattern) {
      await createRecurringSchedules(scheduleData, recurringPattern);
    }

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created successfully'
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Helper function to create recurring schedules
const createRecurringSchedules = async (scheduleData, recurringPattern) => {
  try {
    const schedules = [];
    const startDate = new Date(scheduleData.date);
    const endDate = new Date(recurringPattern.endDate);

    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1); // Start from next day

    while (currentDate <= endDate) {
      let shouldCreateSchedule = false;

      if (recurringPattern.type === 'daily') {
        shouldCreateSchedule = true;
      } else if (recurringPattern.type === 'weekly') {
        const dayOfWeek = currentDate.getDay();
        shouldCreateSchedule = recurringPattern.daysOfWeek.includes(dayOfWeek);
      } else if (recurringPattern.type === 'monthly') {
        shouldCreateSchedule = currentDate.getDate() === recurringPattern.dayOfMonth;
      }

      if (shouldCreateSchedule) {
        // Check for conflicts
        const conflict = await Schedule.findOne({
          employee: scheduleData.employee,
          date: new Date(currentDate),
          status: { $in: ['scheduled', 'in-progress'] },
          isCancelled: false
        });

        if (!conflict) {
          schedules.push({
            ...scheduleData,
            date: new Date(currentDate),
            _id: undefined
          });
        }
      }

      // Move to next occurrence
      if (recurringPattern.type === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (recurringPattern.type === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (recurringPattern.type === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    if (schedules.length > 0) {
      await Schedule.insertMany(schedules);
    }
  } catch (error) {
    console.error('Create recurring schedules error:', error);
  }
};

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Admin/HR
const getAllSchedules = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100, // Increased default limit to show more schedules
      startDate,
      endDate,
      department,
      employee,
      status,
      shiftType
    } = req.query;

    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Debug logging
    console.log('Schedule filter:', {
      startDate: startDate ? new Date(startDate).toISOString() : 'none',
      endDate: endDate ? new Date(endDate).toISOString() : 'none',
      filter
    });

    // Other filters
    if (department) filter.department = department;
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    if (shiftType) filter['shift.type'] = shiftType;

    const schedules = await Schedule.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('createdBy', 'firstName lastName')
      .populate('modifiedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Schedule.countDocuments(filter);
    const totalInDb = await Schedule.countDocuments({});

    console.log(`Found ${schedules.length} schedules with filter, ${totalInDb} total in database`);

    res.json({
      success: true,
      data: schedules,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get my schedules
// @route   GET /api/schedules/my-schedules
// @access  Employee
const getMySchedules = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      status
    } = req.query;

    const filter = { employee: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (status) filter.status = status;

    const schedules = await Schedule.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Schedule.countDocuments(filter);

    res.json({
      success: true,
      data: schedules,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get my schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Admin/HR
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check for conflicts if date or employee is being changed
    if (updateData.date || updateData.employee) {
      const conflictFilter = {
        _id: { $ne: id },
        employee: updateData.employee || schedule.employee,
        date: new Date(updateData.date || schedule.date),
        status: { $in: ['scheduled', 'in-progress'] },
        isCancelled: false
      };

      const conflictingSchedule = await Schedule.findOne(conflictFilter);
      if (conflictingSchedule) {
        return res.status(400).json({
          success: false,
          message: 'Conflicting schedule exists for this employee and date'
        });
      }
    }

    // Track changes for history
    const changes = {};
    Object.keys(updateData).forEach(key => {
      // Skip system fields and modification tracking fields
      if (['_id', 'modificationHistory', 'modificationReason', '__v'].includes(key)) {
        return;
      }

      const oldValue = schedule[key];
      const newValue = updateData[key];

      // Compare values (handle dates specially)
      let hasChanged = false;
      if (key === 'date') {
        hasChanged = new Date(oldValue).getTime() !== new Date(newValue).getTime();
      } else {
        hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
      }

      if (hasChanged) {
        changes[key] = {
          from: oldValue,
          to: newValue
        };
      }
    });

    // Add modification history
    const modificationEntry = {
      modifiedBy: req.user._id,
      modifiedDate: new Date(),
      changes,
      reason: updateData.modificationReason || 'Manual update'
    };

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      {
        ...updateData,
        modifiedBy: req.user._id,
        $push: { modificationHistory: modificationEntry }
      },
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId department')
     .populate('modifiedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedSchedule,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Admin/HR
const cancelSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Delete the schedule from database
    await Schedule.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get schedule statistics
// @route   GET /api/schedules/stats
// @access  Admin/HR
const getScheduleStats = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (department) filter.department = department;

    const stats = await Schedule.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSchedules: { $sum: 1 },
          scheduledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          morningShifts: {
            $sum: { $cond: [{ $eq: ['$shift.type', 'morning'] }, 1, 0] }
          },
          afternoonShifts: {
            $sum: { $cond: [{ $eq: ['$shift.type', 'afternoon'] }, 1, 0] }
          },
          nightShifts: {
            $sum: { $cond: [{ $eq: ['$shift.type', 'night'] }, 1, 0] }
          }
        }
      }
    ]);

    // Department-wise statistics
    const departmentStats = await Schedule.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$department',
          totalSchedules: { $sum: 1 },
          avgShiftDuration: { $avg: '$shiftDuration' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalSchedules: 0,
          scheduledCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          morningShifts: 0,
          afternoonShifts: 0,
          nightShifts: 0
        },
        departmentWise: departmentStats
      }
    });
  } catch (error) {
    console.error('Get schedule stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Request shift swap
// @route   POST /api/schedules/:id/swap-request
// @access  Employee
const requestShiftSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedWith, reason } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Verify the requesting employee owns this schedule
    if (schedule.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only request swaps for your own schedules'
      });
    }

    // Check if the other employee exists
    const otherEmployee = await User.findById(requestedWith);
    if (!otherEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Requested employee not found'
      });
    }

    schedule.isSwapRequest = true;
    schedule.swapRequestDetails = {
      requestedBy: req.user._id,
      requestedWith,
      reason,
      status: 'pending'
    };

    await schedule.save();

    res.json({
      success: true,
      data: schedule,
      message: 'Shift swap request submitted successfully'
    });
  } catch (error) {
    console.error('Request shift swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  createSchedule,
  getAllSchedules,
  getMySchedules,
  updateSchedule,
  cancelSchedule,
  getScheduleStats,
  requestShiftSwap
};