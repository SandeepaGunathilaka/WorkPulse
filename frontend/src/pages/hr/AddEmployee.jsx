import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import employeeService from '../../services/employeeService';

const AddEmployee = () => {
  const navigate = useNavigate();
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
    joiningDate: new Date().toISOString().split('T')[0],
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
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Calculate max date (18 years ago from today)
  const getMaxBirthDate = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  };

  // Calculate min date (65 years ago from today)
  const getMinBirthDate = () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  };

  const departments = [
    'Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics',
    'Neurology', 'Radiology', 'Laboratory', 'Administration', 'IT', 'HR',
    'Surgery', 'Pharmacy', 'Nursing', 'Physiotherapy', 'Dermatology'
  ];

  const designations = {
    'Emergency': ['Emergency Doctor', 'Emergency Nurse', 'Emergency Technician', 'Paramedic'],
    'Cardiology': ['Cardiologist', 'Cardiac Nurse', 'Echo Technician', 'EKG Technician'],
    'Pediatrics': ['Pediatrician', 'Pediatric Nurse', 'Child Specialist', 'Pediatric Therapist'],
    'Orthopedics': ['Orthopedic Surgeon', 'Orthopedic Nurse', 'Physical Therapist', 'X-ray Technician'],
    'Neurology': ['Neurologist', 'Neuro Nurse', 'EEG Technician', 'Neuro Therapist'],
    'Radiology': ['Radiologist', 'Radiology Technician', 'MRI Technician', 'CT Scan Technician'],
    'Laboratory': ['Lab Technician', 'Pathologist', 'Microbiologist', 'Lab Assistant'],
    'Administration': ['Administrator', 'Clerk', 'Receptionist', 'Data Entry Operator'],
    'IT': ['System Administrator', 'Network Engineer', 'Software Developer', 'IT Support'],
    'HR': ['HR Manager', 'HR Assistant', 'Recruiter', 'Training Coordinator'],
    'Surgery': ['Surgeon', 'Operating Room Nurse', 'Anesthesiologist', 'Surgical Technician'],
    'Pharmacy': ['Pharmacist', 'Pharmacy Assistant', 'Drug Information Specialist'],
    'Nursing': ['Staff Nurse', 'Charge Nurse', 'Nursing Supervisor', 'Clinical Nurse'],
    'Physiotherapy': ['Physiotherapist', 'Physical Therapy Assistant', 'Rehabilitation Specialist'],
    'Dermatology': ['Dermatologist', 'Dermatology Nurse', 'Skin Care Specialist']
  };

  // Auto-generate Employee ID when component mounts
  useEffect(() => {
    generateEmployeeId();
  }, []);

  const generateEmployeeId = async () => {
    try {
      const response = await employeeService.generateEmployeeId();
      if (response.success) {
        setFormData(prev => ({ ...prev, employeeId: response.data.employeeId }));
      }
    } catch (error) {
      console.error('Error generating employee ID:', error);
      // Fallback to client-side generation
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 9999) + 1;
      const employeeId = `EMP${year}${randomNum.toString().padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, employeeId }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';

    // Name validation - no special characters like # or other symbols
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (formData.firstName && !nameRegex.test(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters and spaces';
    }
    if (formData.lastName && !nameRegex.test(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters and spaces';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation - exactly 10 digits only
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phoneNumber) {
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      }
    }

    // Emergency contact phone validation - exactly 10 digits only
    if (formData.emergencyContact.phoneNumber) {
      if (!phoneRegex.test(formData.emergencyContact.phoneNumber)) {
        newErrors.emergencyContactPhone = 'Emergency contact phone must be exactly 10 digits';
      }
    }

    // Emergency contact name validation
    if (formData.emergencyContact.name && !nameRegex.test(formData.emergencyContact.name)) {
      newErrors.emergencyContactName = 'Emergency contact name can only contain letters and spaces';
    }

    // Age validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 65) {
        newErrors.dateOfBirth = 'Age must be between 18 and 65 years';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  // Handler for phone fields - only allow digits, max 10 digits
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    // Remove any characters that are not digits
    const filteredValue = value.replace(/[^0-9]/g, '');
    // Limit to exactly 10 digits
    const limitedValue = filteredValue.slice(0, 10);

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: limitedValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: limitedValue }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API (HR registration - no password set)
      const employeeData = {
        employeeId: formData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        designation: formData.designation,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        role: formData.role,
        joiningDate: formData.joiningDate,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        passwordSet: false
      };

      // Call API to create employee
      const response = await employeeService.createEmployee(employeeData);

      if (response.success) {
        setSuccess(true);
        setLoading(false);

        // Show success message and redirect after 2 seconds
        setTimeout(() => {
          navigate('/hr/employees');
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      setLoading(false);

      // Show error message
      const errorMessage = error.message || 'Failed to create employee. Please try again.';
      alert(errorMessage);

      // If it's a validation error, try to extract field-specific errors
      if (error.message.includes('already exists')) {
        setErrors({ email: 'Email already exists' });
      }
    }
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
      joiningDate: new Date().toISOString().split('T')[0],
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
    setErrors({});
    generateEmployeeId();
  };

  if (success) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Added Successfully!</h2>
          <p className="text-gray-600 mb-4">
            {formData.firstName} {formData.lastName} has been added to the system with ID: {formData.employeeId}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">Redirecting to Employee Management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/hr/employees')}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
            <p className="text-gray-600">Fill in the details to register a new employee</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">HR Registration</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Employee ID Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Employee Identification</h3>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Employee ID</label>
                      <p className="text-2xl font-bold text-blue-900">{formData.employeeId}</p>
                    </div>
                    <div className="text-blue-600">
                      <User className="w-8 h-8" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">Auto-generated unique identifier</p>
                </div>
                <button
                  type="button"
                  onClick={generateEmployeeId}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleNameChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name (letters only)"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleNameChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name (letters only)"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      maxLength="10"
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="0712345678 (10 digits only)"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      min={getMinBirthDate()}
                      max={getMaxBirthDate()}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Must be between 18 and 65 years old
                  </p>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    disabled={!formData.department}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.designation ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${!formData.department ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Designation</option>
                    {formData.department && designations[formData.department]?.map(designation => (
                      <option key={designation} value={designation}>{designation}</option>
                    ))}
                  </select>
                  {errors.designation && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.designation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Joining Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.joiningDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.joiningDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.joiningDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-gray-500 text-xs">(System Access Level)</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="employee">Employee</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Default role for hospital staff members
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-600" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleNameChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.emergencyContactName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter contact name (letters only)"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.emergencyContactName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="emergencyContact.phoneNumber"
                    value={formData.emergencyContact.phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength="10"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.emergencyContactPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0712345678 (10 digits only)"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.emergencyContactPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/hr/employees')}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Employee...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Add Employee
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

export default AddEmployee;