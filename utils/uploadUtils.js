const cloudinary = require('../configs/cloudinary');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Single upload configuration for avatar
const uploadSingle = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for avatars
    },
    fileFilter: (req, file, cb) => {
        if (!validateImageType(file.mimetype)) {
            cb(
                new Error('Invalid image type. Allowed types: jpeg, png, gif, webp'),
                false,
            );
            return;
        }
        if (!validateImageSize(file.size)) {
            cb(new Error('Image too large. Maximum size: 50MB'), false);
            return;
        }
        cb(null, true);
    },
}).single('image');

// Multiple upload configuration for products
const uploadMultiple = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 50MB limit for product images
        fieldSize: 100 * 1024 * 1024,
        files: 5, // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        if (!validateImageType(file.mimetype)) {
            cb(
                new Error('Invalid image type. Allowed types: jpeg, png, gif, webp'),
                false,
            );
            return;
        }
        if (!validateImageSize(file.size, 100 * 1024 * 1024)) {
            cb(new Error('Image too large. Maximum size: 100MB'), false);
            return;
        }
        cb(null, true);
    },
}).array('images', 5);

// Validate image type
const validateImageType = (mimetype) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];
    return allowedTypes.includes(mimetype);
};

// Validate image size
const validateImageSize = (size, maxSize = 100 * 1024 * 1024) => {
    return size <= maxSize;
};

module.exports = {
    uploadSingle,
    uploadMultiple,
};
