const express = require('express');
const router = express.Router();
const { protect, isHROrAdmin } = require('../middleware/auth');
const {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getMyAttendance,
  getAllAttendance,
  getAttendanceStats,
  getMyAttendanceStats,
  getTodayAttendance
} = require('../controllers/attendanceController');

// Employee routes
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.post('/break-start', protect, startBreak);
router.post('/break-end', protect, endBreak);
router.get('/my-records', protect, getMyAttendance);
router.get('/my-stats', protect, getMyAttendanceStats);
router.get('/today', protect, getTodayAttendance);

// Admin/HR routes
router.get('/', protect, isHROrAdmin, getAllAttendance);
router.get('/stats', protect, isHROrAdmin, getAttendanceStats);

module.exports = router;