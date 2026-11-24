const path = require('path');
const fs = require('fs');

const BASE_URL = () => (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// DB value -> value sent to the frontend ('/uploads/x.jpg' becomes an absolute URL)
const toPublicUrl = (stored) => {
  if (!stored) return stored;
  return stored.startsWith('/uploads/') ? `${BASE_URL()}${stored}` : stored;
};

// Frontend value -> DB value (absolute URL of our own uploads goes back to '/uploads/x.jpg')
const toStoredPath = (value) => {
  const prefix = `${BASE_URL()}/uploads/`;
  if (value.startsWith(prefix)) return value.slice(BASE_URL().length);
  return value;
};

const isLocalUpload = (stored) => typeof stored === 'string' && stored.startsWith('/uploads/');

// Remove an image file from the server disk (ignores missing files / external URLs)
const deleteLocalImage = async (stored) => {
  if (!isLocalUpload(stored)) return;
  const file = path.join(UPLOAD_DIR, path.basename(stored));
  try {
    await fs.promises.unlink(file);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Could not delete image file:', err.message);
  }
};

module.exports = { toPublicUrl, toStoredPath, isLocalUpload, deleteLocalImage, UPLOAD_DIR };
