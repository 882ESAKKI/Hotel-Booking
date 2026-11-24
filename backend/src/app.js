require('dotenv').config();
const express = require('express');
const cors = require('cors');
const hotelRoutes = require('./routes/hotelRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_DIR } = require('./utils/imageUrl');

const app = express();

const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Uploaded hotel images are served from the Node server
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/hotels', hotelRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
