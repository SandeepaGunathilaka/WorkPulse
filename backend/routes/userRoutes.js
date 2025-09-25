const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Test endpoint (no auth)
router.get('/test', async (req, res) => {
  res.json({ message: 'User routes working!', timestamp: new Date() });
});

// Get all users (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get users by role
router.get('/role/:role', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get total staff count (excluding admin)
router.get('/count/staff', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    const count = await User.countDocuments({
      role: { $in: ['employee', 'nurse', 'doctor', 'staff', 'hr'] }
    });
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching staff count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff count',
      error: error.message
    });
  }
});

// Get user statistics
router.get('/stats', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalHR = await User.countDocuments({ role: 'hr' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalNurses = await User.countDocuments({ role: 'nurse' });

    // Department wise count
    const departments = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEmployees,
        totalAdmins,
        totalHR,
        totalDoctors,
        totalNurses,
        departments
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get single user
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Update user
router.put('/:id', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;