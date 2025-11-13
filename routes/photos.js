const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/photos/:id
 * Get specific photo by ID
 * 
 * Note: Without a database, we can't reliably fetch by ID.
 * This endpoint returns an error suggesting to use the rover photos endpoint instead.
 */
router.get('/:id', (req, res) => {
  res.status(400).json({ 
    errors: 'Photo ID lookup not supported without database. Use /api/v1/rovers/:rover/photos endpoint instead.' 
  });
});

module.exports = router;

