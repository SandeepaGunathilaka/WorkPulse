const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;

    const filter = {};

    // Apply filters
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

    const users = await User.find(filter)
      .select('-password -twoFactorSecret -resetPasswordToken')
      .sort({ createdAt: -1, joiningDate: -1, _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
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

// @desc    Activate user
// @route   PUT /api/admin/users/:id/activate
// @access  Admin
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    user.employmentStatus = 'active';
    await user.save();

    res.json({
      success: true,
      data: user.toJSON(),
      message: 'User activated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Admin
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate admin users'
      });
    }

    user.isActive = false;
    user.employmentStatus = 'inactive';
    await user.save();

    res.json({
      success: true,
      data: user.toJSON(),
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['employee', 'hr', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      data: user.toJSON(),
      message: 'User role updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Admin
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate temporary password for user
// @route   POST /api/admin/users/:id/temp-password
// @access  Admin
const generateTempPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);

    user.password = tempPassword;
    await user.save();

    res.json({
      success: true,
      data: {
        tempPassword
      },
      message: 'Temporary password generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Admin
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const departmentDistribution = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);

    const employmentStatusDistribution = await User.aggregate([
      {
        $group: {
          _id: '$employmentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleDistribution,
        departmentDistribution,
        employmentStatusDistribution
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

// @desc    Get audit logs (placeholder)
// @route   GET /api/admin/logs
// @access  Admin
const getAuditLogs = async (req, res) => {
  try {
    // This would typically come from a separate audit log collection
    const mockLogs = [
      {
        id: 1,
        action: 'USER_CREATED',
        performedBy: req.user.id,
        targetUser: 'user123',
        timestamp: new Date(),
        details: 'New employee created'
      },
      {
        id: 2,
        action: 'USER_DEACTIVATED',
        performedBy: req.user.id,
        targetUser: 'user456',
        timestamp: new Date(Date.now() - 86400000),
        details: 'Employee deactivated'
      }
    ];

    res.json({
      success: true,
      data: mockLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  activateUser,
  deactivateUser,
  updateUserRole,
  resetUserPassword,
  generateTempPassword,
  getSystemStats,
  getAuditLogs
};