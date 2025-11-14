const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const roversRouter = require('./routes/rovers');
const photosRouter = require('./routes/photos');
const manifestsRouter = require('./routes/manifests');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/v1/rovers', roversRouter);
app.use('/api/v1/photos', photosRouter);
app.use('/api/v1/manifests', manifestsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root - serve documentation page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mars Photo API server running on port ${PORT}`);
});

module.exports = app;

