import api from './api';

// Get current user profile
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch profile',
      error: error.response?.data || error.message
    };
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update profile',
      error: error.response?.data || error.message
    };
  }
};

// Format profile data for display
export const formatProfileData = (userData) => {
  if (!userData) return null;

  // Format address
  const formatAddress = (address) => {
    if (!address) return '';
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.country) parts.push(address.country);
    return parts.join(', ');
  };

  // Format emergency contact
  const formatEmergencyContact = (contact) => {
    if (!contact) return '';
    const parts = [];
    if (contact.name) parts.push(contact.name);
    if (contact.relationship) parts.push(`(${contact.relationship})`);
    if (contact.phoneNumber) parts.push(`- ${contact.phoneNumber}`);
    return parts.join(' ');
  };

  return {
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    phone: userData.phoneNumber || '',
    address: formatAddress(userData.address),
    dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
    emergencyContact: formatEmergencyContact(userData.emergencyContact),
    profilePicture: userData.profilePicture || null,
    // Work info
    employeeId: userData.employeeId || '',
    department: userData.department || '',
    designation: userData.designation || '',
    role: userData.role || '',
    joiningDate: userData.joiningDate || '',
    employmentStatus: userData.employmentStatus || ''
  };
};

// Format profile data for backend submission
export const formatProfileForSubmission = (formData) => {
  const submission = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    phoneNumber: formData.phone,
    dateOfBirth: formData.dateOfBirth
  };

  // Handle address - split into components
  if (formData.address) {
    const addressParts = formData.address.split(',').map(part => part.trim());
    submission.address = {
      street: addressParts[0] || '',
      city: addressParts[1] || '',
      state: addressParts[2] || '',
      zipCode: addressParts[3] || '',
      country: addressParts[4] || 'Sri Lanka'
    };
  }

  // Handle emergency contact - parse the string
  if (formData.emergencyContact) {
    const contactString = formData.emergencyContact;
    const nameMatch = contactString.match(/^([^-()]+)(?:\s*\([^)]+\))?/);
    const phoneMatch = contactString.match(/-\s*(.+)$/);
    const relationshipMatch = contactString.match(/\(([^)]+)\)/);

    submission.emergencyContact = {
      name: nameMatch ? nameMatch[1].trim() : '',
      relationship: relationshipMatch ? relationshipMatch[1].trim() : '',
      phoneNumber: phoneMatch ? phoneMatch[1].trim() : ''
    };
  }

  if (formData.profilePicture) {
    submission.profilePicture = formData.profilePicture;
  }

  return submission;
};