const mongoose = require('mongoose');
const LeavePolicy = require('../models/LeavePolicy');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultPolicies = [
  {
    type: 'sick',
    name: 'Sick Leave',
    icon: '🏥',
    color: 'bg-red-500',
    annualAllocation: 14,
    maxConsecutiveDays: 7,
    requiresMedicalCertificate: true,
    medicalCertificateAfterDays: 3,
    carryForward: false,
    encashable: false,
    description: 'Time off for illness or medical appointments',
    rules: [
      'Medical certificate required for absences longer than 3 days',
      'Can be taken in increments of 0.5 days',
      'Manager approval required for planned medical procedures',
      'Does not carry forward to next year'
    ],
    createdBy: null // Will be set to admin ID
  },
  {
    type: 'annual',
    name: 'Annual Leave',
    icon: '🏖️',
    color: 'bg-blue-500',
    annualAllocation: 21,
    maxConsecutiveDays: 14,
    requiresMedicalCertificate: false,
    medicalCertificateAfterDays: null,
    carryForward: true,
    maxCarryForward: 5,
    encashable: true,
    description: 'Vacation and recreational leave',
    rules: [
      'Must be approved by direct manager',
      'Minimum 2 weeks notice required for requests over 5 days',
      'Up to 5 days can be carried forward to next year',
      'Unused days above carry-forward limit can be encashed'
    ],
    createdBy: null
  },
  {
    type: 'casual',
    name: 'Casual Leave',
    icon: '👤',
    color: 'bg-purple-500',
    annualAllocation: 7,
    maxConsecutiveDays: 3,
    requiresMedicalCertificate: false,
    medicalCertificateAfterDays: null,
    carryForward: false,
    encashable: false,
    description: 'Personal matters and family obligations',
    rules: [
      'Manager approval required',
      'Cannot be combined with other leave types',
      'Maximum 3 consecutive days at a time',
      'Does not carry forward to next year'
    ],
    createdBy: null
  },
  {
    type: 'emergency',
    name: 'Emergency Leave',
    icon: '🚨',
    color: 'bg-orange-500',
    annualAllocation: 3,
    maxConsecutiveDays: 2,
    requiresMedicalCertificate: false,
    medicalCertificateAfterDays: null,
    carryForward: false,
    encashable: false,
    description: 'Unforeseen emergencies requiring immediate absence',
    rules: [
      'Can be taken without prior approval',
      'Must notify manager within 24 hours',
      'Documentation may be required for approval',
      'Does not carry forward to next year'
    ],
    createdBy: null
  },
  {
    type: 'maternity',
    name: 'Maternity Leave',
    icon: '👶',
    color: 'bg-pink-500',
    annualAllocation: 90,
    maxConsecutiveDays: 90,
    requiresMedicalCertificate: true,
    medicalCertificateAfterDays: 1,
    carryForward: false,
    encashable: false,
    description: 'Leave for new mothers following childbirth',
    rules: [
      'Medical certificate required',
      'Can be extended with unpaid leave',
      'Job protection guaranteed during leave',
      'Flexible return-to-work options available'
    ],
    createdBy: null
  },
  {
    type: 'paternity',
    name: 'Paternity Leave',
    icon: '👨‍👶',
    color: 'bg-green-500',
    annualAllocation: 14,
    maxConsecutiveDays: 14,
    requiresMedicalCertificate: false,
    medicalCertificateAfterDays: null,
    carryForward: false,
    encashable: false,
    description: 'Leave for new fathers following childbirth or adoption',
    rules: [
      'Birth certificate or adoption papers required',
      'Must be taken within 6 months of birth/adoption',
      'Can be taken in blocks or continuously',
      'Additional unpaid leave may be available'
    ],
    createdBy: null
  }
];

async function seedLeavePolicies() {
  try {
    // Find admin user
    const User = require('../models/User');
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      console.log('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Set admin as creator for all policies
    const policiesWithCreator = defaultPolicies.map(policy => ({
      ...policy,
      createdBy: admin._id
    }));

    // Clear existing policies
    await LeavePolicy.deleteMany({});
    console.log('🗑️  Cleared existing leave policies');

    // Insert new policies
    const insertedPolicies = await LeavePolicy.insertMany(policiesWithCreator);
    console.log(`✅ Successfully seeded ${insertedPolicies.length} leave policies:`);

    insertedPolicies.forEach(policy => {
      console.log(`   - ${policy.name} (${policy.type})`);
    });

    console.log('\n🎉 Leave policies seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding leave policies:', error);
    process.exit(1);
  }
}

seedLeavePolicies();