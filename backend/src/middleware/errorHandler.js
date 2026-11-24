const multer = require('multer');

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image size should not exceed 5MB.' : err.message;
    return res.status(400).json({ success: false, message, errors: { image: message } });
  }
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message, ...(err.errors && { errors: err.errors }) });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = { notFound, errorHandler };
