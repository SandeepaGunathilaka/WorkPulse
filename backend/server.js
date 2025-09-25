const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', (req, res, next) => {
  console.log(`🔗 Leave API request: ${req.method} ${req.originalUrl}`);
  next();
}, leaveRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);


app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'WorkPulse Hospital Management System is running'
  });
});

// Staff count endpoint
app.get('/api/staff/count', async (req, res) => {
  console.log('🔍 Staff count endpoint called!');
  try {
    const User = require('./models/User');
    const count = await User.countDocuments({
      role: { $in: ['employee', 'nurse', 'doctor', 'staff', 'hr'] }
    });
    console.log('✅ Staff count retrieved:', count);
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('❌ Error fetching staff count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff count',
      count: 0
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workpulse_hospital')
.then(() => {
  console.log('✅ Connected to MongoDB');

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});