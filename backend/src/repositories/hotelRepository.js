// All database access uses NATIVE parameterised SQL (no ORM).
const pool = require('../config/db');

const COLUMNS = `id, title, description, price, latitude, longitude, image,
  location_name, rating, reviews_count, amenities, tags, created_at, updated_at`;

const SORTS = {
  newest: 'created_at DESC, id DESC',
  'price-low': 'price ASC, id ASC',
  'price-high': 'price DESC, id ASC',
  rating: 'rating DESC, reviews_count DESC, id ASC',
};

async function findAll({ search, minPrice, maxPrice, sortBy, offset, limit }) {
  const where = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`title ILIKE $${params.length}`);
  }
  if (minPrice !== undefined) {
    params.push(minPrice);
    where.push(`price >= $${params.length}`);
  }
  if (maxPrice !== undefined) {
    params.push(maxPrice);
    where.push(`price <= $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = SORTS[sortBy] || SORTS.newest;

  const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM hotels ${whereSql}`, params);

  const listParams = [...params, limit, offset];
  const listRes = await pool.query(
    `SELECT ${COLUMNS} FROM hotels ${whereSql}
     ORDER BY ${orderSql}
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return { total: countRes.rows[0].total, rows: listRes.rows };
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM hotels WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function insert(h) {
  const { rows } = await pool.query(
    `INSERT INTO hotels
       (title, description, price, latitude, longitude, image, location_name, rating, reviews_count, amenities, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)
     RETURNING ${COLUMNS}`,
    [
      h.title, h.description, h.price, h.latitude, h.longitude, h.image,
      h.locationName || 'Coimbatore, Tamil Nadu',
      h.rating ?? 4.5,
      h.reviewsCount ?? 1,
      JSON.stringify(h.amenities || ['Free Wi-Fi', 'Air Conditioning']),
      JSON.stringify(h.tags || ['New Listing', 'Free Cancellation']),
    ]
  );
  return rows[0];
}

// COALESCE keeps the old value for anything the client did not send
async function update(id, h) {
  const { rows } = await pool.query(
    `UPDATE hotels SET
       title         = $2,
       description   = $3,
       price         = $4,
       latitude      = $5,
       longitude     = $6,
       image         = COALESCE($7, image),
       location_name = COALESCE($8, location_name),
       rating        = COALESCE($9, rating),
       reviews_count = COALESCE($10, reviews_count),
       amenities     = COALESCE($11::jsonb, amenities),
       tags          = COALESCE($12::jsonb, tags),
       updated_at    = NOW()
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [
      id, h.title, h.description, h.price, h.latitude, h.longitude,
      h.image ?? null,
      h.locationName ?? null,
      h.rating ?? null,
      h.reviewsCount ?? null,
      h.amenities ? JSON.stringify(h.amenities) : null,
      h.tags ? JSON.stringify(h.tags) : null,
    ]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rows } = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING id, title, image', [id]);
  return rows[0] || null;
}

// Used by the "reset defaults" endpoint
async function replaceAll(hotels) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const old = await client.query('DELETE FROM hotels RETURNING image');
    await client.query('ALTER SEQUENCE hotels_id_seq RESTART WITH 1');
    for (const h of [...hotels].reverse()) { // reversed: list is sorted newest-first
      await client.query(
        `INSERT INTO hotels
           (title, description, price, latitude, longitude, image, location_name, rating, reviews_count, amenities, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)`,
        [h.title, h.description, h.price, h.latitude, h.longitude, h.image, h.locationName,
         h.rating, h.reviewsCount, JSON.stringify(h.amenities), JSON.stringify(h.tags)]
      );
    }
    await client.query('COMMIT');
    return old.rows.map((r) => r.image);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function count() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM hotels');
  return rows[0].n;
}

module.exports = { findAll, findById, insert, update, remove, replaceAll, count };
