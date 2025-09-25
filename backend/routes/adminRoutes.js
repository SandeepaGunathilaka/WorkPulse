const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  activateUser,
  deactivateUser,
  updateUserRole,
  resetUserPassword,
  generateTempPassword,
  getSystemStats,
  getAuditLogs
} = require('../controllers/adminController');

// User management
router.get('/users', protect, isAdmin, getAllUsers);
router.put('/users/:id/activate', protect, isAdmin, activateUser);
router.put('/users/:id/deactivate', protect, isAdmin, deactivateUser);
router.put('/users/:id/role', protect, isAdmin, updateUserRole);
router.put('/users/:id/reset-password', protect, isAdmin, resetUserPassword);
router.post('/users/:id/temp-password', protect, isAdmin, generateTempPassword);

// System stats
router.get('/stats', protect, isAdmin, getSystemStats);

// Audit logs
router.get('/logs', protect, isAdmin, getAuditLogs);

module.exports = router;