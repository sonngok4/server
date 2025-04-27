const multer = require('multer');
const path = require('path');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

        const fileExt = path.extname(file.originalname).toLowerCase();
        const mimeTypeOk = allowedMimes.includes(file.mimetype);
        const extensionOk = allowedExtensions.includes(fileExt);

        if (mimeTypeOk || extensionOk) {
            cb(null, true);
        } else {
            cb(new Error(`Chỉ cho phép tải lên file ảnh! (MIME: ${file.mimetype}, Ext: ${fileExt})`), false);
        }
    }
});

module.exports = upload;
