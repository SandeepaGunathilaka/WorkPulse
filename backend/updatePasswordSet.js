const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const updatePasswordSetField = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all existing users to have passwordSet: true (they already have passwords)
    const result = await User.updateMany(
      { passwordSet: { $exists: false } }, // Only update where passwordSet doesn't exist
      { $set: { passwordSet: true } }
    );

    console.log(`Updated ${result.modifiedCount} users with passwordSet: true`);

    // Show some sample data
    const sampleUsers = await User.find({}).select('firstName lastName passwordSet').limit(5);
    console.log('Sample users:');
    sampleUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName}: passwordSet = ${user.passwordSet}`);
    });

  } catch (error) {
    console.error('Error updating passwordSet field:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updatePasswordSetField();