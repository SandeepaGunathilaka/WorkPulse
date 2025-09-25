const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const addTestEmployee = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add a test employee without password set
    const testEmployee = await User.create({
      employeeId: 'EMP20250999',
      email: 'test.employee@hospital.lk',
      password: 'temppassword123', // This will be hashed automatically
      firstName: 'Test',
      lastName: 'Employee',
      phoneNumber: '+94771234567',
      department: 'Emergency',
      designation: 'Nurse',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
      role: 'employee',
      passwordSet: false // This employee needs password to be set by admin
    });

    console.log('Test employee created:', {
      id: testEmployee._id,
      name: `${testEmployee.firstName} ${testEmployee.lastName}`,
      employeeId: testEmployee.employeeId,
      passwordSet: testEmployee.passwordSet
    });

  } catch (error) {
    console.error('Error creating test employee:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addTestEmployee();