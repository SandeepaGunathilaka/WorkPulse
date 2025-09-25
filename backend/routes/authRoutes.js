const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe); // Alias for /me route
router.put('/profile', protect, updateProfile); // Update profile
router.put('/updatepassword', protect, updatePassword);
router.get('/logout', protect, logout);

module.exports = router;