const express = require('express');
const router = express.Router();
const { protect, authorize, isHROrAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/leaveController');

// Admin leave policy management routes (specific routes first)
router.get('/admin/policies', protect, isHROrAdmin, getLeavePolicies);

// Admin/HR leave balance management routes (specific routes first)
router.get('/admin/balances', protect, isHROrAdmin, getAllLeaveBalances);
router.put('/admin/balances/:employeeId', protect, isHROrAdmin, updateLeaveBalance);

// Admin leave policy management routes (specific routes first)
router.post('/admin/policies', protect, authorize('admin'), createLeavePolicy);
router.put('/admin/policies/:id', protect, authorize('admin'), updateLeavePolicy);
router.delete('/admin/policies/:id', protect, authorize('admin'), deleteLeavePolicy);


// Employee routes
router.post('/', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/balance', protect, getLeaveBalance);
router.get('/policies', protect, getLeavePolicies);  // Allow all authenticated users to view policies
router.put('/:id', protect, updateLeave);
router.delete('/:id', protect, cancelLeave);

// Admin/HR routes (general routes after specific ones)
router.get('/', protect, isHROrAdmin, getAllLeaves);
router.get('/stats', protect, isHROrAdmin, getLeaveStats);
router.put('/:id/approve', protect, isHROrAdmin, approveLeave);
router.put('/:id/reject', protect, isHROrAdmin, rejectLeave);

module.exports = router;