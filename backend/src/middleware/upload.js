const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const HttpError = require('../utils/httpError');
const { UPLOAD_DIR } = require('../utils/imageUrl');

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `hotel-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB (same as the frontend check)
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(new HttpError(400, 'Only JPG, PNG, WEBP or GIF images are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = upload.single('image');
