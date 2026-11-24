const repo = require('../repositories/hotelRepository');
const HttpError = require('../utils/httpError');
const { toPublicUrl, deleteLocalImage } = require('../utils/imageUrl');
const seedHotels = require('../data/seedHotels.json');

// DB row (snake_case) -> API object (camelCase, same shape the React app already uses)
const serialize = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  price: Number(r.price),
  latitude: r.latitude,
  longitude: r.longitude,
  image: toPublicUrl(r.image),
  locationName: r.location_name,
  rating: Number(r.rating),
  reviewsCount: r.reviews_count,
  amenities: r.amenities,
  tags: r.tags,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const parseId = (raw) => {
  if (!/^\d+$/.test(String(raw))) throw new HttpError(404, `Hotel with ID "${raw}" was not found.`);
  return Number(raw);
};

const optionalNumber = (v, name) => {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) throw new HttpError(400, `${name} must be a non-negative number.`);
  return n;
};

// GET /api/hotels?search=&minPrice=&maxPrice=&offset=0&limit=10&sortBy=newest
exports.getHotels = async (req, res, next) => {
  try {
    const q = req.query;
    const offset = optionalNumber(q.offset, 'offset') ?? 0;
    let limit = optionalNumber(q.limit, 'limit') ?? 10;
    limit = Math.min(Math.max(Math.floor(limit), 1), 100);

    const minPrice = optionalNumber(q.minPrice, 'minPrice');
    const maxPrice = optionalNumber(q.maxPrice, 'maxPrice');
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new HttpError(400, 'minPrice cannot be greater than maxPrice.');
    }

    const search = (q.search ?? q.title ?? '').toString().trim();
    const { total, rows } = await repo.findAll({
      search, minPrice, maxPrice, sortBy: q.sortBy, offset: Math.floor(offset), limit,
    });

    res.json({ success: true, total, offset: Math.floor(offset), limit, data: rows.map(serialize) });
  } catch (err) { next(err); }
};

// GET /api/hotels/:id
exports.getHotel = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const row = await repo.findById(id);
    if (!row) throw new HttpError(404, `Hotel with ID "${req.params.id}" was not found.`);
    res.json({ success: true, data: serialize(row) });
  } catch (err) { next(err); }
};

// POST /api/hotels   (multipart/form-data or JSON)
exports.createHotel = async (req, res, next) => {
  try {
    const row = await repo.insert(req.hotelData);
    res.status(201).json({ success: true, message: 'Hotel created successfully.', data: serialize(row) });
  } catch (err) {
    if (req.hotelData?.uploadedFile) await deleteLocalImage(req.hotelData.image);
    next(err);
  }
};

// PUT /api/hotels/:id
exports.updateHotel = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const existing = await repo.findById(id);
    if (!existing) {
      if (req.hotelData.uploadedFile) await deleteLocalImage(req.hotelData.image);
      throw new HttpError(404, `Hotel with ID "${req.params.id}" was not found.`);
    }

    const row = await repo.update(id, req.hotelData);

    // image replaced -> remove the old file from the server
    if (req.hotelData.image && req.hotelData.image !== existing.image) {
      await deleteLocalImage(existing.image);
    }
    res.json({ success: true, message: 'Hotel updated successfully.', data: serialize(row) });
  } catch (err) {
    if (req.hotelData?.uploadedFile) await deleteLocalImage(req.hotelData.image);
    next(err);
  }
};

// DELETE /api/hotels/:id[?deleteImage=false]
exports.deleteHotel = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const removed = await repo.remove(id);
    if (!removed) throw new HttpError(404, `Hotel with ID "${req.params.id}" was not found.`);

    // associated image file is deleted unless the client opts out
    if (String(req.query.deleteImage).toLowerCase() !== 'false') {
      await deleteLocalImage(removed.image);
    }
    res.json({ success: true, message: 'Hotel deleted successfully.', data: { id: removed.id, title: removed.title } });
  } catch (err) { next(err); }
};

// POST /api/hotels/reset-defaults  (extra: used by the app's "Reset" button)
exports.resetDefaults = async (_req, res, next) => {
  try {
    const oldImages = await repo.replaceAll(seedHotels);
    await Promise.all(oldImages.map(deleteLocalImage));
    const { rows } = await repo.findAll({ sortBy: 'newest', offset: 0, limit: 100 });
    res.json({ success: true, total: rows.length, data: rows.map(serialize) });
  } catch (err) { next(err); }
};
