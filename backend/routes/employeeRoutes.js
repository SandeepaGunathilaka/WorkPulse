const express = require('express');
const router = express.Router();
const { protect, isHROrAdmin, isAdmin } = require('../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  generateEmployeeIdEndpoint,
  setEmployeePassword,
  updateEmployeeSalary
} = require('../controllers/employeeController');

// @route   GET /api/employees/stats
router.get('/stats', protect, isHROrAdmin, getEmployeeStats);

// @route   GET /api/employees/generate-id
router.get('/generate-id', protect, isHROrAdmin, generateEmployeeIdEndpoint);

// @route   GET /api/employees
router.get('/', protect, isHROrAdmin, getAllEmployees);

// @route   GET /api/employees/:id
router.get('/:id', protect, getEmployeeById);

// @route   POST /api/employees
router.post('/', protect, isHROrAdmin, createEmployee);

// @route   PUT /api/employees/:id
router.put('/:id', protect, isHROrAdmin, updateEmployee);

// @route   DELETE /api/employees/:id
router.delete('/:id', protect, isHROrAdmin, deleteEmployee);

// @route   PUT /api/employees/:id/password
router.put('/:id/password', protect, isAdmin, setEmployeePassword);

// @route   PUT /api/employees/:id/salary
router.put('/:id/salary', protect, isHROrAdmin, updateEmployeeSalary);

module.exports = router;