const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (or Admin/HR only)
exports.register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      employeeId,
      firstName,
      lastName,
      phoneNumber,
      department,
      designation,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      role
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or employee ID already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      employeeId,
      firstName,
      lastName,
      phoneNumber,
      department,
      designation,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      role: role || 'employee'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  console.log('📞📞📞 LOGIN ENDPOINT CALLED 📞📞📞');
  try {
    const { email, password } = req.body;

    console.log('🚨🚨🚨 LOGIN ATTEMPT 🚨🚨🚨 for email:', email);
    console.log('🔑🔑🔑 PASSWORD RECEIVED 🔑🔑🔑:', password);

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? `Yes - ${user.firstName} ${user.lastName}` : 'No');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        department: user.department,
        profilePicture: user.profilePicture,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user details'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Generate reset token (simplified version - in production, use crypto)
    const resetToken = Math.random().toString(36).substr(2, 15);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // In production, send email with reset link
    // For now, just return the token
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken // In production, don't send this in response
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.resettoken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      address,
      emergencyContact,
      profilePicture
    } = req.body;

    // Find user and update fields that are allowed to be updated by the user
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update only allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address) user.address = address;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};