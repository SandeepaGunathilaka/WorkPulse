const QRCode = require('qrcode');
const { cloudinary } = require('../config/cloudinary');

// Generate QR code for attendance
const generateAttendanceQR = async (employeeId, date) => {
  try {
    const qrData = {
      type: 'attendance',
      employeeId,
      date: date || new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };

    const qrString = JSON.stringify(qrData);

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'workpulse/qr-codes',
          resource_type: 'image',
          public_id: `attendance_${employeeId}_${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(qrBuffer);
    });

    return {
      success: true,
      qrCode: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        data: qrData,
        qrString
      }
    };
  } catch (error) {
    console.error('QR code generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate QR code for employee identification
const generateEmployeeQR = async (employee) => {
  try {
    const qrData = {
      type: 'employee',
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
      designation: employee.designation,
      timestamp: Date.now()
    };

    const qrString = JSON.stringify(qrData);

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'workpulse/qr-codes',
          resource_type: 'image',
          public_id: `employee_${employee.employeeId}_${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(qrBuffer);
    });

    return {
      success: true,
      qrCode: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        data: qrData,
        qrString
      }
    };
  } catch (error) {
    console.error('Employee QR code generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate QR code for location/department check-in
const generateLocationQR = async (location) => {
  try {
    const qrData = {
      type: 'location',
      locationId: location.id,
      building: location.building,
      floor: location.floor,
      unit: location.unit,
      department: location.department,
      timestamp: Date.now()
    };

    const qrString = JSON.stringify(qrData);

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'workpulse/qr-codes',
          resource_type: 'image',
          public_id: `location_${location.id}_${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(qrBuffer);
    });

    return {
      success: true,
      qrCode: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        data: qrData,
        qrString
      }
    };
  } catch (error) {
    console.error('Location QR code generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate QR code data
const validateQRCode = (qrString) => {
  try {
    const qrData = JSON.parse(qrString);

    // Check if QR code is not expired (24 hours for attendance)
    if (qrData.type === 'attendance') {
      const qrAge = Date.now() - qrData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (qrAge > maxAge) {
        return {
          valid: false,
          error: 'QR code has expired'
        };
      }
    }

    return {
      valid: true,
      data: qrData
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid QR code format'
    };
  }
};

module.exports = {
  generateAttendanceQR,
  generateEmployeeQR,
  generateLocationQR,
  validateQRCode
};