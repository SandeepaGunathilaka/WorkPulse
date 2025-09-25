const express = require('express');
const router = express.Router();
const {
  uploadProfilePicture,
  uploadDocument,
  deleteFile,
  getOptimizedImage
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const {
  uploadProfilePicture: profileUpload,
  uploadDocument: documentUpload
} = require('../config/cloudinary');

// Profile picture upload
router.post('/profile-picture', protect, profileUpload.single('profilePicture'), uploadProfilePicture);

// Document upload (for leave applications, etc.)
router.post('/document', protect, documentUpload.single('document'), uploadDocument);

// Delete file
router.delete('/:publicId', protect, deleteFile);

// Get optimized image URL
router.get('/optimize/:publicId', getOptimizedImage);

// Error handler for multer errors
router.use((error, req, res, next) => {
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }
  next();
});

module.exports = router;