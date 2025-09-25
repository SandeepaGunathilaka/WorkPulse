const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is HR or Admin
exports.isHROrAdmin = (req, res, next) => {
  if (req.user.role !== 'hr' && req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Only HR, Manager or Admin can access this route'
    });
  }
  next();
};

// Check if user is Admin only
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only Admin can access this route'
    });
  }
  next();
};

// Check if user can access their own resource or is admin/hr
exports.canAccessResource = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceUserId = req.params[paramName];

      // Admin and HR can access all resources
      if (req.user.role === 'admin' || req.user.role === 'hr') {
        return next();
      }

      // Managers can access resources in their department
      if (req.user.role === 'manager') {
        const resourceUser = await User.findById(resourceUserId);
        if (resourceUser && resourceUser.department === req.user.department) {
          return next();
        }
      }

      // Regular employees can only access their own resources
      if (req.user._id.toString() === resourceUserId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    } catch (error) {
      console.error('Resource access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};