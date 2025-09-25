import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Key,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Building2,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download
} from 'lucide-react';

const EmployeeRegistration = () => {
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: '',
    dateOfBirth: '',
    gender: '',
    role: 'employee',
    password: '',
    confirmPassword: '',
    temporaryPassword: false,
    requirePasswordChange: true,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmployee, setRegisteredEmployee] = useState(null);

  const departments = [
    'Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics',
    'Neurology', 'Radiology', 'Laboratory', 'Administration', 'IT', 'HR'
  ];

  // Auto-generate Employee ID when component mounts
  useEffect(() => {
    generateEmployeeId();
  }, []);

  const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    const employeeId = `EMP${year}${randomNum.toString().padStart(4, '0')}`;
    setFormData(prev => ({ ...prev, employeeId }));
  };

  const generatePassword = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password,
      temporaryPassword: true
    }));
  };

  // Handler for name fields - only allow letters and spaces
  const handleNameChange = (e) => {
    const { name, value } = e.target;
    // Remove any characters that are not letters or spaces
    const filteredValue = value.replace(/[^a-zA-Z\s]/g, '');

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: filteredValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: filteredValue }));
    }
  };

  // Handler for phone fields - only allow digits and +
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    // Remove any characters that are not digits or +
    const filteredValue = value.replace(/[^0-9+]/g, '');

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: filteredValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: filteredValue }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.phoneNumber.trim()) return 'Phone number is required';
    if (!formData.department) return 'Department is required';
    if (!formData.designation.trim()) return 'Designation is required';
    if (!formData.password.trim()) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';

    // Name validation - no special characters like # or other symbols
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (formData.firstName && !nameRegex.test(formData.firstName)) {
      return 'First name can only contain letters and spaces';
    }
    if (formData.lastName && !nameRegex.test(formData.lastName)) {
      return 'Last name can only contain letters and spaces';
    }

    // Phone validation - only digits and +
    const phoneRegex = /^[\+]?[0-9]+$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      return 'Phone number can only contain digits and + symbol';
    }

    // Emergency contact validations
    if (formData.emergencyContact.phoneNumber && !phoneRegex.test(formData.emergencyContact.phoneNumber)) {
      return 'Emergency contact phone can only contain digits and + symbol';
    }
    if (formData.emergencyContact.name && !nameRegex.test(formData.emergencyContact.name)) {
      return 'Emergency contact name can only contain letters and spaces';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Invalid email format';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);

    try {
      // API call to create employee with password
      console.log('Creating employee with password:', {
        ...formData,
        password: '[HIDDEN]'
      });

      // Simulate API call
      setTimeout(() => {
        const newEmployee = {
          ...formData,
          _id: Math.random().toString(36).substr(2, 9),
          isActive: true,
          employmentStatus: 'active',
          createdAt: new Date().toISOString(),
          hasInitialPassword: formData.temporaryPassword
        };

        setRegisteredEmployee(newEmployee);
        setRegistrationComplete(true);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to create employee:', error);
      setLoading(false);
      alert('Failed to register employee. Please try again.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      department: '',
      designation: '',
      dateOfBirth: '',
      gender: '',
      role: 'employee',
      password: '',
      confirmPassword: '',
      temporaryPassword: false,
      requirePasswordChange: true,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Sri Lanka'
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phoneNumber: ''
      }
    });
    setGeneratedPassword('');
    setRegistrationComplete(false);
    setRegisteredEmployee(null);
    generateEmployeeId();
  };

  if (registrationComplete && registeredEmployee) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Registered Successfully</h1>
            <p className="text-gray-600">New employee account has been created with login credentials</p>
          </div>

          {/* Employee Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Employee ID</label>
                <p className="text-lg font-bold text-blue-600">{registeredEmployee.employeeId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-lg font-semibold">{registeredEmployee.firstName} {registeredEmployee.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="text-sm">{registeredEmployee.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Department</label>
                <p className="text-sm">{registeredEmployee.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Role</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  registeredEmployee.role === 'admin' ? 'bg-red-100 text-red-800' :
                  registeredEmployee.role === 'hr' ? 'bg-blue-100 text-blue-800' :
                  registeredEmployee.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {registeredEmployee.role}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Login Credentials Card */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">Login Credentials</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-yellow-700">Username/Email</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded border text-sm">{registeredEmployee.email}</code>
                      <button
                        onClick={() => copyToClipboard(registeredEmployee.email)}
                        className="p-1 text-yellow-600 hover:text-yellow-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-yellow-700">
                      {formData.temporaryPassword ? 'Temporary Password' : 'Password'}
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded border text-sm">
                        {showPassword ? formData.password : '••••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-yellow-600 hover:text-yellow-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(formData.password)}
                        className="p-1 text-yellow-600 hover:text-yellow-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {formData.temporaryPassword && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Important Security Notice:</p>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li>This is a temporary password that should be shared securely</li>
                          <li>Employee will be required to change password on first login</li>
                          <li>Password access will expire after first successful login</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={resetForm}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Register Another Employee
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Print Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Registration</h1>
          <p className="text-gray-600">Register new employees with system access credentials</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-700">Admin Access</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee ID Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Employee ID</label>
                  <p className="text-xl font-bold text-blue-900">{formData.employeeId}</p>
                  <p className="text-xs text-blue-600">Auto-generated unique identifier</p>
                </div>
                <button
                  type="button"
                  onClick={generateEmployeeId}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleNameChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name (letters only)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleNameChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name (letters only)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+94712345678 (digits only)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-gray-500 text-xs">(System Access Level)</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Employee is the default role for hospital staff
                  </p>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Credentials</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Password Setup</h4>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate Password
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="temporaryPassword"
                        checked={formData.temporaryPassword}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">This is a temporary password</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="requirePasswordChange"
                        checked={formData.requirePasswordChange}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require password change on first login</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleNameChange}
                    placeholder="Enter name (letters only)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="emergencyContact.phoneNumber"
                    value={formData.emergencyContact.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number (digits only)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register Employee
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegistration;