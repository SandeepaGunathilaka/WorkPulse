const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Seed users function
const seedUsers = async () => {
  try {
    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    const existingHR = await User.findOne({ email: 'hr@gmail.com' });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
    } else {
      // Create Admin User
      const hashedAdminPassword = await bcrypt.hash('123456', 12);
      const adminUser = new User({
        employeeId: 'ADM001',
        email: 'admin@gmail.com',
        password: hashedAdminPassword,
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
      console.log('   Email: admin@gmail.com');
      console.log('   Password: 123456');
    }

    if (existingHR) {
      console.log('ℹ️  HR user already exists');
    } else {
      // Create HR User
      const hashedHRPassword = await bcrypt.hash('123456', 12);
      const hrUser = new User({
        employeeId: 'HR001',
        email: 'hr@gmail.com',
        password: hashedHRPassword,
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
      console.log('   Email: hr@gmail.com');
      console.log('   Password: 123456');
    }

    console.log('\n🎉 User seeding completed!');
    console.log('\nYou can now login with:');
    console.log('👨‍💼 Admin: admin@gmail.com / 123456');
    console.log('👩‍💼 HR: hr@gmail.com / 123456');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding process
const runSeed = async () => {
  await connectDB();
  await seedUsers();
};

runSeed();