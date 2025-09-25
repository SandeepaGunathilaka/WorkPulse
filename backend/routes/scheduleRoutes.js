const express = require('express');
const router = express.Router();
const { protect, isHROrAdmin } = require('../middleware/auth');
const {
  createSchedule,
  getAllSchedules,
  getMySchedules,
  updateSchedule,
  cancelSchedule,
  getScheduleStats,
  requestShiftSwap
} = require('../controllers/scheduleController');

// Employee routes
router.get('/my-schedules', protect, getMySchedules);
router.post('/:id/swap-request', protect, requestShiftSwap);

// Admin/HR routes
router.post('/', protect, isHROrAdmin, createSchedule);
router.get('/', protect, isHROrAdmin, getAllSchedules);
router.get('/stats', protect, isHROrAdmin, getScheduleStats);
router.put('/:id', protect, isHROrAdmin, updateSchedule);
router.delete('/:id', protect, isHROrAdmin, cancelSchedule);

module.exports = router;