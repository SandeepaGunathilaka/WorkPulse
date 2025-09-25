const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const { sendPasswordNotificationEmail } = require('./services/emailService');

const resetEmployeePassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the employee
    const email = 'ravindupasanjith1542@gmail.com';
    const newPassword = 'Employee@123'; // New password to set

    const employee = await User.findOne({ email });

    if (!employee) {
      console.log('Employee not found');
      return;
    }

    console.log('Employee found:', employee.firstName, employee.lastName);

    // Update the password (will be hashed by pre-save hook)
    employee.password = newPassword;
    employee.passwordSet = true;
    await employee.save();

    console.log('✅ Password updated successfully');
    console.log('New password:', newPassword);

    // Send email notification
    try {
      await sendPasswordNotificationEmail(employee, newPassword);
      console.log('✅ Email notification sent to:', employee.email);
    } catch (emailError) {
      console.error('Failed to send email:', emailError.message);
    }

    // Test the new password
    const isPasswordValid = await bcrypt.compare(newPassword, employee.password);
    console.log('Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    console.log('\n🔐 Login Credentials:');
    console.log('Email:', employee.email);
    console.log('Password:', newPassword);
    console.log('Employee ID:', employee.employeeId);
    console.log('Role:', employee.role);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

resetEmployeePassword();