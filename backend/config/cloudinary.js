const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Profile Pictures Storage
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'workpulse/profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ]
  }
});

// Document Storage (for leave documents, etc.)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'workpulse/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'auto'
  }
});

// QR Code Storage
const qrCodeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'workpulse/qr-codes',
    allowed_formats: ['png', 'jpg'],
    transformation: [
      { width: 300, height: 300, crop: 'fit' },
      { quality: 'auto' }
    ]
  }
});

// Multer instances
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, and Word documents are allowed'), false);
    }
  }
});

const uploadQRCode = multer({
  storage: qrCodeStorage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB limit
  }
});

// Helper function to delete files from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to get optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options
  });
};

module.exports = {
  cloudinary,
  uploadProfilePicture,
  uploadDocument,
  uploadQRCode,
  deleteFromCloudinary,
  getOptimizedUrl
};