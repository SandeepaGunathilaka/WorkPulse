const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Schedule = require('../models/Schedule');

// ========================
// CLOCK IN
// ========================
const clockIn = async (req, res) => {
  try {
    const { location, method = 'web' } = req.body;
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: 'You have already clocked in today'
      });
    }

    const todaySchedule = await Schedule.findOne({
      employee: userId,
      date: today,
      status: 'scheduled'
    });

    const clockInData = {
      user: userId,
      date: today,
      checkIn: {
        time: new Date(),
        location: location || {},
        method
      },
      shift: todaySchedule?._id,
      status: 'present'
    };

    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        clockInData,
        { new: true, runValidators: true }
      ).populate('user', 'firstName lastName employeeId department');
    } else {
      attendance = await Attendance.create(clockInData);
      attendance = await attendance.populate('user', 'firstName lastName employeeId department');
    }

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Successfully clocked in'
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// ========================
// CLOCK OUT
// ========================
const clockOut = async (req, res) => {
  try {
    const { location, method = 'web' } = req.body;
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance || !attendance.checkIn?.time) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must clock in first' 
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already clocked out today' 
      });
    }

    attendance.checkOut = {
      time: new Date(),
      location: location || {},
      method
    };

    await attendance.save();
    await attendance.populate('user', 'firstName lastName employeeId department');

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Successfully clocked out'
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// ========================
// START BREAK
// ========================
const startBreak = async (req, res) => {
  try {
    const { type = 'other' } = req.body;
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance || !attendance.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: 'You must clock in first'
      });
    }

    const ongoingBreak = attendance.breaks.find(b => b.startTime && !b.endTime);
    if (ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'You are already on a break'
      });
    }

    attendance.breaks.push({
      startTime: new Date(),
      type
    });

    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Break started successfully'
    });
  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ========================
// END BREAK
// ========================
const endBreak = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for today'
      });
    }

    const ongoingBreak = attendance.breaks.find(b => b.startTime && !b.endTime);
    if (!ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'No ongoing break found'
      });
    }

    ongoingBreak.endTime = new Date();
    const breakDuration = (ongoingBreak.endTime - ongoingBreak.startTime) / (1000 * 60);
    ongoingBreak.duration = Math.round(breakDuration);

    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Break ended successfully'
    });
  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ========================
// GET MY ATTENDANCE (Employee)
// ========================
const getMyAttendance = async (req, res) => {
  try {
    console.log('🔍 getMyAttendance called with:', {
      query: req.query,
      userId: req.user?._id,
      userRole: req.user?.role
    });
    
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const userId = req.user._id;

    const filter = { user: userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const attendance = await Attendance.find(filter)
      .populate('user', 'firstName lastName employeeId department')
      .populate('shift')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);
    console.log('📊 Found attendance records:', attendance.length, 'Total:', total);

    // Calculate summary statistics
    const summary = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          totalHours: { $sum: '$workHours' },
          totalOvertime: { $sum: '$overtime' },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      }
    ]);

    const responseData = {
      success: true,
      data: attendance.map(record => ({
        _id: record._id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workHours: record.workHours,
        overtime: record.overtime,
        status: record.status,
        breaks: record.breaks,
        user: record.user,
        shift: record.shift
      })),
      summary: summary[0] || {
        totalDays: 0,
        totalHours: 0,
        totalOvertime: 0,
        presentDays: 0,
        lateDays: 0
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    };

    console.log('📤 Sending response:', {
      success: responseData.success,
      dataCount: responseData.data.length,
      summary: responseData.summary,
      pagination: responseData.pagination
    });

    res.json(responseData);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// ========================
// GET ALL ATTENDANCE (Admin/HR)
// ========================
const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      status,
      department,
      employeeId,
      search
    } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

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

    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter).select('_id');
      filter.user = { $in: users.map(u => u._id) };
    }

    const attendance = await Attendance.find(filter)
      .populate('user', 'firstName lastName employeeId department')
      .populate('shift')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    const formattedData = attendance.map(record => ({
      id: record._id,
      name: `${record.user?.firstName || ''} ${record.user?.lastName || ''}`,
      employeeId: record.user?.employeeId || 'N/A',
      department: record.user?.department || 'N/A',
      clockIn: record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : '-',
      clockOut: record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : '-',
      workingHours: `${record.workHours?.toFixed(2)}h`,
      overtime: `${record.overtime?.toFixed(2)}h`,
      status: record.status,
      date: record.date,
      shift: record.shift ? 'day' : 'day' // Default to day shift, can be enhanced later
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// ========================
// GET ATTENDANCE STATISTICS (Admin/HR)
// ========================
const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    let userFilter = {};
    if (department) userFilter.department = department;

    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter).select('_id');
      filter.user = { $in: users.map(u => u._id) };
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          totalWorkHours: { $sum: '$workHours' },
          totalOvertimeHours: { $sum: '$overtime' },
          avgWorkHours: { $avg: '$workHours' }
        }
      }
    ]);

    const departmentStats = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.department',
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          avgWorkHours: { $avg: '$workHours' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          totalWorkHours: 0,
          totalOvertimeHours: 0,
          avgWorkHours: 0
        },
        departmentWise: departmentStats
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ========================
// GET MY ATTENDANCE STATISTICS (Employee)
// ========================
const getMyAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, type = 'monthly' } = req.query;
    const userId = req.user._id;

    const filter = { user: userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    } else {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filter.date = { $gte: firstDay, $lte: lastDay };
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          totalWorkHours: { $sum: '$workHours' },
          totalOvertimeHours: { $sum: '$overtime' },
          avgWorkHours: { $avg: '$workHours' },
          totalBreakTime: {
            $sum: {
              $reduce: {
                input: '$breaks',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.duration', 0] }] }
              }
            }
          }
        }
      }
    ]);

    const dailyStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          status: { $first: '$status' },
          workHours: { $first: '$workHours' },
          overtime: { $first: '$overtime' },
          checkInTime: { $first: '$checkIn.time' },
          checkOutTime: { $first: '$checkOut.time' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const punctualityStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          totalWorkHours: 0,
          totalOvertimeHours: 0,
          avgWorkHours: 0,
          totalBreakTime: 0
        },
        daily: dailyStats,
        punctuality: punctualityStats,
        period: {
          startDate: filter.date.$gte,
          endDate: filter.date.$lte,
          type
        }
      }
    });
  } catch (error) {
    console.error('Get my attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ========================
// GET TODAY'S ATTENDANCE
// ========================
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    }).populate('shift');

    if (!attendance) {
      return res.json({
        success: true,
        data: null,
        message: 'No attendance record for today'
      });
    }

    const ongoingBreak = attendance.breaks.find(b => b.startTime && !b.endTime);

    res.json({
      success: true,
      data: {
        ...attendance.toObject(),
        isOnBreak: !!ongoingBreak,
        currentBreak: ongoingBreak
      }
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getMyAttendance,
  getAllAttendance,
  getAttendanceStats,
  getMyAttendanceStats,
  getTodayAttendance
};