const express = require('express');
const router = express.Router();
const { getRoverInfo, getLatestSol, getPhotos, ROVERS, calculateEarthDate } = require('../services/nasaApi');

/**
 * GET /api/v1/manifests/:rover_id
 * Get mission manifest for a rover
 */
router.get('/:rover_id', async (req, res) => {
  try {
    const roverId = req.params.rover_id;
    const roverInfo = getRoverInfo(roverId);
    
    if (!roverInfo) {
      return res.status(400).json({ errors: 'Invalid Rover Name' });
    }
    
    const latestSol = await getLatestSol(roverId);
    
    // Build manifest photos array
    // This is a simplified version - in the original, it groups by sol
    // For performance, we'll sample a few sols to build the manifest
    const manifestPhotos = [];
    const sampleSols = [];
    
    // Sample every 100 sols up to latest
    for (let sol = 0; sol <= latestSol; sol += 100) {
      sampleSols.push(sol);
    }
    // Always include latest sol
    if (!sampleSols.includes(latestSol)) {
      sampleSols.push(latestSol);
    }
    
    // Get photos for sample sols to build manifest
    for (const sol of sampleSols.slice(0, 10)) { // Limit to 10 sols for performance
      try {
        const photos = await getPhotos(roverId, { sol });
        if (photos.length > 0) {
          const cameras = [...new Set(photos.map(p => p.camera.name))];
          manifestPhotos.push({
            sol: sol,
            earth_date: calculateEarthDate(roverInfo.landing_date, sol),
            total_photos: photos.length,
            cameras: cameras
          });
        }
      } catch (e) {
        // Skip errors for individual sols
        console.error(`Error fetching sol ${sol}:`, e.message);
      }
    }
    
    // Sort by sol
    manifestPhotos.sort((a, b) => a.sol - b.sol);
    
    // Calculate approximate total photos
    let totalPhotos = 0;
    try {
      const latestPhotos = await getPhotos(roverId, { sol: latestSol });
      // Rough estimate: average photos per sol * total sols
      const avgPhotosPerSol = latestPhotos.length;
      totalPhotos = Math.round(avgPhotosPerSol * latestSol);
    } catch (e) {
      // Ignore errors
    }
    
    const manifest = {
      name: roverInfo.name,
      landing_date: roverInfo.landing_date,
      launch_date: roverInfo.launch_date,
      status: roverInfo.status,
      max_sol: latestSol,
      max_date: calculateMaxDate(roverInfo.landing_date, latestSol),
      total_photos: totalPhotos,
      photos: manifestPhotos
    };
    
    res.json({ photo_manifest: manifest });
  } catch (error) {
    console.error('Error fetching manifest:', error);
    if (error.message.includes('not yet supported')) {
      return res.status(501).json({ errors: error.message });
    }
    res.status(500).json({ errors: 'Internal server error' });
  }
});

// Helper function
function calculateMaxDate(landingDate, maxSol) {
  const SECONDS_PER_SOL = 88775.244;
  const SECONDS_PER_DAY = 86400;
  const landing = new Date(landingDate);
  const earthDaysSinceLanding = (maxSol * SECONDS_PER_SOL) / SECONDS_PER_DAY;
  const maxDate = new Date(landing.getTime() + earthDaysSinceLanding * 24 * 60 * 60 * 1000);
  return maxDate.toISOString().split('T')[0];
}

module.exports = router;

