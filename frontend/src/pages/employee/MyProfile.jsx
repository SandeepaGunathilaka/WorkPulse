import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Mail, Phone, MapPin, Calendar, Building, Edit2, Save, Camera, Shield, Award, Briefcase, Clock, Star, CheckCircle, BookOpen, Heart, Users, Loader2 } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import { getProfile, updateProfile, formatProfileData, formatProfileForSubmission } from '../../services/profileService';

const MyProfile = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
  });
  const [originalData, setOriginalData] = useState(null);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const result = await getProfile();
        if (result.success) {
          const formattedData = formatProfileData(result.data);
          setProfileData(formattedData);
          setOriginalData(formattedData);
          setProfilePicture(formattedData.profilePicture);
        } else {
          showError(result.message || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        showError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showError]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const submissionData = formatProfileForSubmission(profileData);
      const result = await updateProfile(submissionData);

      if (result.success) {
        showSuccess('Profile updated successfully!');
        setIsEditing(false);
        setOriginalData(profileData);
      } else {
        showError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  const handleProfilePictureUpload = (uploadData) => {
    setProfilePicture(uploadData.url);
    setProfileData({ ...profileData, profilePicture: uploadData.url });
    setShowUpload(false);
    showSuccess('Profile picture uploaded successfully!');
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    showError('Failed to upload image');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Hero Header */}
      <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Profile 👤</h1>
              <p className="text-blue-100 text-lg">Manage your personal information and settings</p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Profile Card */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="absolute bottom-0 right-0 bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-all duration-300 hover:scale-110 shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {showUpload && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <FileUpload
                  type="profile-picture"
                  acceptedTypes="image/jpeg,image/jpg,image/png,image/gif"
                  maxSize={5}
                  onUploadSuccess={handleProfilePictureUpload}
                  onUploadError={handleUploadError}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {profileData.firstName} {profileData.lastName}
            </h2>
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">{originalData?.employeeId || user?.employeeId || 'EMP001'}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Building className="w-4 h-4" />
                <span className="text-sm">{originalData?.department || user?.department || 'General'}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">{originalData?.role || user?.role || 'Employee'}</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Active Employee
              </div>
              <div className="flex items-center justify-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" />
                Verified Profile
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">2.5</div>
                <div className="text-xs text-gray-500">Years</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">95%</div>
                <div className="text-xs text-gray-500">Attendance</div>
              </div>
            </div>
          </div>

          {/* Achievement Card */}
          <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-lg">Employee of the Month</h3>
                <p className="text-yellow-100 text-sm">December 2024</p>
              </div>
            </div>
            <p className="text-yellow-100 text-sm">Outstanding performance and dedication!</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-600" />
                  Personal Information
                </h2>
                <p className="text-gray-600 mt-1">Keep your information up to date</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* First Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-900 font-medium">{profileData.firstName}</p>
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-900 font-medium">{profileData.lastName}</p>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 pl-12 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{profileData.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 pl-12 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{profileData.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="lg:col-span-2 group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <textarea
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      rows="3"
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 pl-12 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{profileData.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 pl-12 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{new Date(profileData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Emergency Contact</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.emergencyContact}
                      onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 pl-12 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{profileData.emergencyContact}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Work Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Work Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{originalData?.department || user?.department || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">{originalData?.role || user?.role || 'Employee'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-medium">{originalData?.employeeId || user?.employeeId || 'EMP001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Join Date:</span>
                  <span className="font-medium">{originalData?.joiningDate ? new Date(originalData.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Skills & Certifications */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Skills & Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'First Aid Certified',
                  'CPR Training',
                  'Healthcare Excellence',
                  'Team Leadership',
                  'Patient Care'
                ].map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;