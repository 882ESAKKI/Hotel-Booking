const HttpError = require('../utils/httpError');
const { toStoredPath } = require('../utils/imageUrl');
const { deleteLocalImage } = require('../utils/imageUrl');

const parseList = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch (_) { /* fall through */ }
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
};

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(v);

/**
 * Validates the body (+ optional uploaded file) and puts a clean object on req.hotelData.
 * isCreate=true  -> every required field must be present
 * isCreate=false -> PUT: same rules, but the image may be omitted (old image is kept)
 */
const validateHotel = (isCreate) => async (req, _res, next) => {
  const b = req.body || {};
  const errors = {};
  const data = {};

  // title
  if (isBlank(b.title)) errors.title = 'Hotel title is required.';
  else if (String(b.title).trim().length < 3) errors.title = 'Hotel title must be at least 3 characters long.';
  else if (String(b.title).trim().length > 100) errors.title = 'Hotel title cannot exceed 100 characters.';
  else data.title = String(b.title).trim();

  // description
  if (isBlank(b.description)) errors.description = 'Description is required.';
  else if (String(b.description).trim().length < 15) errors.description = 'Description must be at least 15 characters long.';
  else data.description = String(b.description).trim();

  // price
  if (isBlank(b.price)) errors.price = 'Price is required.';
  else {
    const price = Number(b.price);
    if (Number.isNaN(price) || price <= 0) errors.price = 'Price must be a valid number greater than 0.';
    else if (price > 50000) errors.price = 'Price cannot exceed 50,000.';
    else data.price = price;
  }

  // latitude
  if (isBlank(b.latitude)) errors.latitude = 'Latitude is required.';
  else {
    const lat = Number(b.latitude);
    if (Number.isNaN(lat)) errors.latitude = 'Latitude must be a valid decimal number.';
    else if (lat < -90 || lat > 90) errors.latitude = 'Latitude must be between -90 and 90.';
    else data.latitude = lat;
  }

  // longitude
  if (isBlank(b.longitude)) errors.longitude = 'Longitude is required.';
  else {
    const lng = Number(b.longitude);
    if (Number.isNaN(lng)) errors.longitude = 'Longitude must be a valid decimal number.';
    else if (lng < -180 || lng > 180) errors.longitude = 'Longitude must be between -180 and 180.';
    else data.longitude = lng;
  }

  // optional fields
  if (!isBlank(b.locationName)) data.locationName = String(b.locationName).trim().slice(0, 150);
  if (!isBlank(b.rating)) {
    const r = Number(b.rating);
    if (Number.isNaN(r) || r < 0 || r > 5) errors.rating = 'Rating must be between 0 and 5.';
    else data.rating = r;
  }
  if (!isBlank(b.reviewsCount)) {
    const rc = Number(b.reviewsCount);
    if (!Number.isInteger(rc) || rc < 0) errors.reviewsCount = 'reviewsCount must be a non-negative integer.';
    else data.reviewsCount = rc;
  }
  const amenities = parseList(b.amenities);
  if (amenities) data.amenities = amenities;
  const tags = parseList(b.tags);
  if (tags) data.tags = tags;

  // image: uploaded file (multipart "image") OR image URL string in body.image
  if (req.file) {
    data.image = `/uploads/${req.file.filename}`;
    data.uploadedFile = true;
  } else if (!isBlank(b.image)) {
    const url = String(b.image).trim();
    if (!isHttpUrl(url)) errors.image = 'Image must be an uploaded file or a valid http/https URL.';
    else data.image = toStoredPath(url);
  } else if (isCreate) {
    errors.image = 'An image is required (upload a file or provide an image URL).';
  }

  if (Object.keys(errors).length) {
    // validation failed -> don't leave an orphan upload on disk
    if (req.file) await deleteLocalImage(`/uploads/${req.file.filename}`);
    return next(new HttpError(400, 'Validation failed', errors));
  }

  req.hotelData = data;
  next();
};

module.exports = { validateCreate: validateHotel(true), validateUpdate: validateHotel(false) };
