const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const checkTestEmployee = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find test employee
    const testEmployee = await User.findOne({ employeeId: 'EMP20250999' });

    if (testEmployee) {
      console.log('Test Employee Found:');
      console.log('- Name:', testEmployee.firstName, testEmployee.lastName);
      console.log('- Employee ID:', testEmployee.employeeId);
      console.log('- passwordSet:', testEmployee.passwordSet);
      console.log('- passwordSet type:', typeof testEmployee.passwordSet);
      console.log('- Raw document:', JSON.stringify(testEmployee.toJSON(), null, 2));
    } else {
      console.log('Test employee not found');
    }

  } catch (error) {
    console.error('Error checking test employee:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkTestEmployee();