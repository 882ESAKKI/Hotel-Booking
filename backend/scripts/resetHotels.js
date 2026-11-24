// npm run db:reset
// Deletes EVERY hotel (and its uploaded image files) and loads the Coimbatore hotels from src/data/seedHotels.json
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const seed = require('../src/data/seedHotels.json');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hotel_management',
  });
  await client.connect();

  try {
    await client.query('BEGIN');
    const old = await client.query('DELETE FROM hotels RETURNING image');
    await client.query('ALTER SEQUENCE hotels_id_seq RESTART WITH 1');

    // reversed so the list (sorted newest-first) shows the hotels in the seed order
    for (const h of [...seed].reverse()) {
      await client.query(
        `INSERT INTO hotels (title, description, price, latitude, longitude, image, location_name, rating, reviews_count, amenities, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)`,
        [h.title, h.description, h.price, h.latitude, h.longitude, h.image, h.locationName,
         h.rating, h.reviewsCount, JSON.stringify(h.amenities), JSON.stringify(h.tags)]
      );
    }
    await client.query('COMMIT');

    // remove old uploaded image files from the server disk
    let removed = 0;
    for (const { image } of old.rows) {
      if (image && image.startsWith('/uploads/')) {
        try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(image))); removed++; } catch (_) { /* already gone */ }
      }
    }
    console.log(`Removed ${old.rowCount} old hotels (${removed} image files)`);
    console.log(`Added ${seed.length} Coimbatore hotels`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
})().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
