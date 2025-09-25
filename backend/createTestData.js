const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Schedule = require('./models/Schedule');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workpulse_hospital');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create test employees
const createTestEmployees = async () => {
  try {
    // Check if test employees already exist
    const existingEmployees = await User.find({ role: 'employee' });
    if (existingEmployees.length >= 5) {
      console.log('✅ Test employees already exist');
      return existingEmployees.slice(0, 5);
    }

    const testEmployees = [
      {
        firstName: 'Kamal',
        lastName: 'Perera',
        email: 'kamal.perera@hospital.lk',
        employeeId: 'EMP001',
        role: 'employee',
        department: 'Emergency',
        designation: 'Nurse',
        phoneNumber: '+94771234567',
        gender: 'male',
        address: {
          street: '123 Galle Road',
          city: 'Colombo',
          state: 'Western',
          zipCode: '00100',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Nimal Perera',
          relationship: 'Brother',
          phoneNumber: '+94777654321'
        },
        dateOfBirth: new Date('1990-05-15'),
        joiningDate: new Date('2022-01-15'),
        salary: 75000,
        isActive: true,
        passwordSet: true
      },
      {
        firstName: 'Saman',
        lastName: 'Silva',
        email: 'saman.silva@hospital.lk',
        employeeId: 'EMP002',
        role: 'employee',
        department: 'ICU',
        designation: 'Doctor',
        phoneNumber: '+94772345678',
        gender: 'male',
        address: {
          street: '456 Kandy Road',
          city: 'Kandy',
          state: 'Central',
          zipCode: '20000',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Kamala Silva',
          relationship: 'Wife',
          phoneNumber: '+94778765432'
        },
        dateOfBirth: new Date('1985-08-22'),
        joiningDate: new Date('2021-06-10'),
        salary: 125000,
        isActive: true,
        passwordSet: true
      },
      {
        firstName: 'Nimali',
        lastName: 'Fernando',
        email: 'nimali.fernando@hospital.lk',
        employeeId: 'EMP003',
        role: 'employee',
        department: 'Pediatrics',
        designation: 'Nurse',
        phoneNumber: '+94773456789',
        gender: 'female',
        address: {
          street: '789 Negombo Road',
          city: 'Negombo',
          state: 'Western',
          zipCode: '11500',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Sunil Fernando',
          relationship: 'Husband',
          phoneNumber: '+94779876543'
        },
        dateOfBirth: new Date('1992-12-03'),
        joiningDate: new Date('2022-09-01'),
        salary: 70000,
        isActive: true,
        passwordSet: true
      },
      {
        firstName: 'Rohan',
        lastName: 'Jayawardena',
        email: 'rohan.jayawardena@hospital.lk',
        employeeId: 'EMP004',
        role: 'employee',
        department: 'Surgery',
        designation: 'Surgeon',
        phoneNumber: '+94774567890',
        gender: 'male',
        address: {
          street: '321 Matara Road',
          city: 'Matara',
          state: 'Southern',
          zipCode: '81000',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Priya Jayawardena',
          relationship: 'Mother',
          phoneNumber: '+94780987654'
        },
        dateOfBirth: new Date('1980-03-18'),
        joiningDate: new Date('2020-11-20'),
        salary: 150000,
        isActive: true,
        passwordSet: true
      },
      {
        firstName: 'Malani',
        lastName: 'Wickramasinghe',
        email: 'malani.wickramasinghe@hospital.lk',
        employeeId: 'EMP005',
        role: 'employee',
        department: 'Cardiology',
        designation: 'Cardiologist',
        phoneNumber: '+94775678901',
        gender: 'female',
        address: {
          street: '654 Kurunegala Road',
          city: 'Kurunegala',
          state: 'North Western',
          zipCode: '60000',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Asanka Wickramasinghe',
          relationship: 'Husband',
          phoneNumber: '+94781098765'
        },
        dateOfBirth: new Date('1987-11-25'),
        joiningDate: new Date('2021-03-15'),
        salary: 140000,
        isActive: true,
        passwordSet: true
      }
    ];

    // Hash password for all employees
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('employee123', salt);

    const employees = testEmployees.map(emp => ({
      ...emp,
      password: hashedPassword
    }));

    const createdEmployees = await User.insertMany(employees);
    console.log(`✅ Created ${createdEmployees.length} test employees`);
    return createdEmployees;
  } catch (error) {
    console.error('❌ Error creating test employees:', error);
    return [];
  }
};

// Create test schedules
const createTestSchedules = async (employees) => {
  try {
    // Clear existing test schedules
    await Schedule.deleteMany({});

    const schedules = [];
    const today = new Date();
    const departments = ['Emergency', 'ICU', 'Pediatrics', 'Surgery', 'Cardiology'];
    const shiftTypes = ['morning', 'afternoon', 'night'];
    const shiftTimes = {
      morning: { startTime: '06:00', endTime: '14:00' },
      afternoon: { startTime: '14:00', endTime: '22:00' },
      night: { startTime: '22:00', endTime: '06:00' }
    };

    // Create schedules for the current month and next 30 days starting from today
    const actualToday = new Date(); // Get real current date
    console.log('📅 Creating schedules starting from:', actualToday.toDateString());

    for (let i = 0; i < 30; i++) {
      const scheduleDate = new Date(actualToday);
      scheduleDate.setDate(actualToday.getDate() + i);

      // Create 2-3 random schedules per day
      const schedulesPerDay = Math.floor(Math.random() * 2) + 2; // 2-3 schedules

      const usedEmployees = new Set(); // Track used employees for this date

      for (let j = 0; j < schedulesPerDay && usedEmployees.size < employees.length; j++) {
        let randomEmployee;
        let attempts = 0;

        // Find an employee who doesn't already have a schedule for this date
        do {
          randomEmployee = employees[Math.floor(Math.random() * employees.length)];
          attempts++;
        } while (usedEmployees.has(randomEmployee._id.toString()) && attempts < 10);

        if (usedEmployees.has(randomEmployee._id.toString())) {
          continue; // Skip if we can't find an unused employee
        }

        usedEmployees.add(randomEmployee._id.toString());

        const randomShiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
        const shiftTime = shiftTimes[randomShiftType];

        const schedule = {
          employee: randomEmployee._id,
          date: new Date(scheduleDate), // Create new date object
          shift: {
            type: randomShiftType,
            startTime: shiftTime.startTime,
            endTime: shiftTime.endTime,
            breakDuration: 30
          },
          department: randomEmployee.department,
          location: {
            building: `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`, // A, B, or C
            floor: `Floor ${Math.floor(Math.random() * 5) + 1}`, // Floor 1-5
            unit: randomEmployee.department,
            room: `Room ${Math.floor(Math.random() * 20) + 101}` // Room 101-120
          },
          status: Math.random() > 0.8 ? 'completed' : 'scheduled',
          createdBy: randomEmployee._id,
          notes: `${randomShiftType.charAt(0).toUpperCase() + randomShiftType.slice(1)} shift for ${randomEmployee.department}`
        };

        schedules.push(schedule);
      }
    }

    const createdSchedules = await Schedule.insertMany(schedules);
    console.log(`✅ Created ${createdSchedules.length} test schedules`);
    return createdSchedules;
  } catch (error) {
    console.error('❌ Error creating test schedules:', error);
    return [];
  }
};

// Create admin user if not exists
const createAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return existingAdmin;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@hospital.lk',
      employeeId: 'ADM001',
      role: 'admin',
      department: 'Administration',
      designation: 'System Administrator',
      phoneNumber: '+94701234567',
      gender: 'male',
      address: {
        street: '1 Hospital Road',
        city: 'Colombo',
        state: 'Western',
        zipCode: '00100',
        country: 'Sri Lanka'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Emergency',
        phoneNumber: '+94701234568'
      },
      dateOfBirth: new Date('1980-01-01'),
      joiningDate: new Date('2020-01-01'),
      salary: 200000,
      isActive: true,
      passwordSet: true,
      password: hashedPassword
    });

    await adminUser.save();
    console.log('✅ Created admin user - Email: admin@hospital.lk, Password: admin123');
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return null;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();

    console.log('🚀 Creating test data...');

    // Create admin user
    const admin = await createAdminUser();

    // Create test employees
    const employees = await createTestEmployees();

    // Create test schedules
    const schedules = await createTestSchedules(employees);

    console.log('\n📊 Test Data Summary:');
    console.log(`👤 Admin Users: ${admin ? 1 : 0}`);
    console.log(`👥 Employees: ${employees.length}`);
    console.log(`📅 Schedules: ${schedules.length}`);

    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@hospital.lk / admin123');
    console.log('Employee: kamal.perera@hospital.lk / employee123');
    console.log('Employee: saman.silva@hospital.lk / employee123');
    console.log('Employee: nimali.fernando@hospital.lk / employee123');
    console.log('Employee: rohan.jayawardena@hospital.lk / employee123');
    console.log('Employee: malani.wickramasinghe@hospital.lk / employee123');

    console.log('\n✅ Test data creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in main function:', error);
    process.exit(1);
  }
};

// Run the script
main();