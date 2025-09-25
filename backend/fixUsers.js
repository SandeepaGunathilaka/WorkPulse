const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workpulse_hospital');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix users function
const fixUsers = async () => {
  try {
    // Delete existing users
    await User.deleteMany({ email: { $in: ['admin@gmail.com', 'hr@gmail.com'] } });
    console.log('🗑️  Existing users deleted');

    // Create Admin User (password will be hashed by pre-save middleware)
    const adminUser = new User({
      employeeId: 'ADM001',
      email: 'admin@gmail.com',
      password: '123456', // Plain text password - will be hashed by pre-save middleware
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+94771234567',
      department: 'Administration',
      designation: 'System Administrator',
      dateOfBirth: new Date('1985-01-01'),
      gender: 'male',
      address: {
        street: '123 Admin Street',
        city: 'Colombo',
        state: 'Western Province',
        zipCode: '00100',
        country: 'Sri Lanka'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phoneNumber: '+94771234568'
      },
      joiningDate: new Date(),
      employmentStatus: 'active',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');

    // Create HR User (password will be hashed by pre-save middleware)
    const hrUser = new User({
      employeeId: 'HR001',
      email: 'hr@gmail.com',
      password: '123456', // Plain text password - will be hashed by pre-save middleware
      role: 'hr',
      firstName: 'Human',
      lastName: 'Resources',
      phoneNumber: '+94771234569',
      department: 'Human Resources',
      designation: 'HR Manager',
      dateOfBirth: new Date('1988-06-15'),
      gender: 'female',
      address: {
        street: '456 HR Avenue',
        city: 'Colombo',
        state: 'Western Province',
        zipCode: '00200',
        country: 'Sri Lanka'
      },
      emergencyContact: {
        name: 'HR Emergency',
        relationship: 'Family',
        phoneNumber: '+94771234570'
      },
      joiningDate: new Date(),
      employmentStatus: 'active',
      isActive: true
    });

    await hrUser.save();
    console.log('✅ HR user created successfully');

    console.log('\n🎉 User fix completed!');
    console.log('\nYou can now login with:');
    console.log('👨‍💼 Admin: admin@gmail.com / 123456');
    console.log('👩‍💼 HR: hr@gmail.com / 123456');

  } catch (error) {
    console.error('❌ Error fixing users:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the fix process
const runFix = async () => {
  await connectDB();
  await fixUsers();
};

runFix();