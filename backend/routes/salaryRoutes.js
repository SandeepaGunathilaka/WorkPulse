const express = require('express');
const router = express.Router();
const {
  calculateSalary,
  createSalary,
  getAllSalaries,
  getMySalaries,
  getSalaryById,
  updateSalary,
  deleteSalary,
  approveSalary,
  getSalaryStats
} = require('../controllers/salaryController');

const { protect, authorize } = require('../middleware/auth');

// Public routes (none for salaries)

// Protected routes - All salary routes require authentication
router.use(protect);

// Employee routes
router.get('/my-salaries', authorize('employee'), getMySalaries);

// Admin/HR routes
router.get('/stats', authorize('admin', 'hr'), getSalaryStats);
router.post('/calculate', authorize('admin', 'hr'), calculateSalary);
router.post('/', authorize('admin', 'hr'), createSalary);
router.get('/', authorize('admin', 'hr'), getAllSalaries);
router.put('/:id/approve', authorize('admin', 'hr'), approveSalary);
router.put('/:id', authorize('admin', 'hr'), updateSalary);
router.delete('/:id', authorize('admin', 'hr'), deleteSalary);

// Both admin/hr and employee can view specific salary (with restrictions)
router.get('/:id', getSalaryById);

module.exports = router;