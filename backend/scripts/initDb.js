// npm run db:init   -> creates database (if missing) + table
// npm run db:seed   -> same, and inserts the 12 sample hotels when the table is empty
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};
const dbName = process.env.DB_NAME || 'hotel_management';

(async () => {
  // 1. create the database if it does not exist
  const admin = new Client({ ...cfg, database: 'postgres' });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!exists.rowCount) {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '')}"`);
    console.log(`Database "${dbName}" created`);
  } else {
    console.log(`Database "${dbName}" already exists`);
  }
  await admin.end();

  // 2. create the table
  const client = new Client({ ...cfg, database: dbName });
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8'));
  console.log('Table "hotels" ready');

  // 3. optional seed
  if (process.argv.includes('--seed')) {
    const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM hotels');
    if (rows[0].n === 0) {
      const seed = require('../src/data/seedHotels.json');
      for (const h of [...seed].reverse()) { // reversed: list is sorted newest-first
        await client.query(
          `INSERT INTO hotels (title, description, price, latitude, longitude, image, location_name, rating, reviews_count, amenities, tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)`,
          [h.title, h.description, h.price, h.latitude, h.longitude, h.image, h.locationName,
           h.rating, h.reviewsCount, JSON.stringify(h.amenities), JSON.stringify(h.tags)]
        );
      }
      console.log(`Seeded ${seed.length} sample hotels`);
    } else {
      console.log('Table already has data, seed skipped');
    }
  }
  await client.end();
})().catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
