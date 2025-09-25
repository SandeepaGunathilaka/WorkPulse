const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const checkUserPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by email
    const email = 'ravindupasanjith1542@gmail.com';
    const testPassword = 'Employee@123'; // Replace with actual password you set

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    console.log('\n✅ User found:');
    console.log('- Name:', user.firstName, user.lastName);
    console.log('- Email:', user.email);
    console.log('- Employee ID:', user.employeeId);
    console.log('- Password Set:', user.passwordSet);
    console.log('- Role:', user.role);
    console.log('- Active:', user.isActive);
    console.log('- Has password hash:', !!user.password);

    // Test password
    console.log('\n🔐 Testing password...');
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('Password matches:', isMatch);

    // Also test with comparePassword method
    const isMethodMatch = await user.comparePassword(testPassword);
    console.log('Password matches (method):', isMethodMatch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkUserPassword();