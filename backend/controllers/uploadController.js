const User = require('../models/User');
const { deleteFromCloudinary, getOptimizedUrl } = require('../config/cloudinary');

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPublicId = user.profilePicture.split('/').pop().split('.')[0];
      await deleteFromCloudinary(`workpulse/profile-pictures/${oldPublicId}`);
    }

    // Update user with new profile picture URL
    user.profilePicture = req.file.path;
    await user.save();

    // Get optimized URL
    const optimizedUrl = getOptimizedUrl(req.file.filename, {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'face'
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        url: req.file.path,
        optimizedUrl,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
};

// @desc    Upload document (for leave applications, etc.)
// @route   POST /api/upload/document
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: req.file.path,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        format: req.file.format
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:publicId
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { folder } = req.query;

    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;
    const result = await deleteFromCloudinary(fullPublicId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error deleting file',
        error: result.error
      });
    }
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// @desc    Get optimized image URL
// @route   GET /api/upload/optimize/:publicId
// @access  Public
exports.getOptimizedImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { width, height, quality = 'auto' } = req.query;

    const optimizedUrl = getOptimizedUrl(publicId, {
      width: parseInt(width) || undefined,
      height: parseInt(height) || undefined,
      quality,
      crop: 'fill'
    });

    res.status(200).json({
      success: true,
      data: {
        originalUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`,
        optimizedUrl
      }
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating optimized image',
      error: error.message
    });
  }
};