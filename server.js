const express = require('express');
const cors = require('cors');
require('dotenv').config();

const roversRouter = require('./routes/rovers');
const photosRouter = require('./routes/photos');
const manifestsRouter = require('./routes/manifests');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/rovers', roversRouter);
app.use('/api/v1/photos', photosRouter);
app.use('/api/v1/manifests', manifestsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Mars Photo API - Express.js',
    version: '1.0.0',
    endpoints: {
      rovers: '/api/v1/rovers',
      photos: '/api/v1/rovers/:rover/photos',
      latest_photos: '/api/v1/rovers/:rover/latest_photos',
      manifests: '/api/v1/manifests/:rover'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Mars Photo API server running on port ${PORT}`);
});

module.exports = app;

