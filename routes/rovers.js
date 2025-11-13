const express = require('express');
const router = express.Router();
const { getRoverInfo, getLatestSol, getPhotos, ROVERS } = require('../services/nasaApi');

/**
 * GET /api/v1/rovers
 * List all rovers
 */
router.get('/', async (req, res) => {
  try {
    const rovers = await Promise.all(
      Object.keys(ROVERS).map(async (key) => {
        const roverData = ROVERS[key];
        const latestSol = await getLatestSol(key);
        
        // Get a sample of photos to calculate total (this is approximate)
        // In a real implementation, you might want to cache this
        let totalPhotos = 0;
        try {
          const photos = await getPhotos(key, { sol: latestSol });
          totalPhotos = photos.length * latestSol; // Rough estimate
        } catch (e) {
          // Ignore errors for total photos calculation
        }
        
        return {
          id: key === 'curiosity' ? 5 : key === 'perseverance' ? 6 : key === 'opportunity' ? 3 : 2,
          name: roverData.name,
          landing_date: roverData.landingDate,
          launch_date: roverData.launchDate,
          status: roverData.status,
          max_sol: latestSol,
          max_date: calculateMaxDate(roverData.landingDate, latestSol),
          total_photos: totalPhotos,
          cameras: roverData.cameras
        };
      })
    );
    
    res.json({ rovers });
  } catch (error) {
    console.error('Error fetching rovers:', error);
    res.status(500).json({ errors: 'Internal server error' });
  }
});

/**
 * GET /api/v1/rovers/:rover_id
 * Get specific rover
 */
router.get('/:rover_id', async (req, res) => {
  try {
    const roverId = req.params.rover_id;
    const roverInfo = getRoverInfo(roverId);
    
    if (!roverInfo) {
      return res.status(400).json({ errors: 'Invalid Rover Name' });
    }
    
    const latestSol = await getLatestSol(roverId);
    
    // Get approximate total photos
    let totalPhotos = 0;
    try {
      const photos = await getPhotos(roverId, { sol: latestSol });
      totalPhotos = photos.length * latestSol; // Rough estimate
    } catch (e) {
      // Ignore errors
    }
    
    const rover = {
      ...roverInfo,
      max_sol: latestSol,
      max_date: calculateMaxDate(roverInfo.landing_date, latestSol),
      total_photos: totalPhotos
    };
    
    res.json({ rover });
  } catch (error) {
    console.error('Error fetching rover:', error);
    res.status(500).json({ errors: 'Internal server error' });
  }
});

/**
 * GET /api/v1/rovers/:rover_id/photos
 * Get photos for a rover
 */
router.get('/:rover_id/photos', async (req, res) => {
  try {
    const roverId = req.params.rover_id;
    const { sol, earth_date, camera, page, per_page } = req.query;
    
    // Validate rover
    const roverInfo = getRoverInfo(roverId);
    if (!roverInfo) {
      return res.status(400).json({ errors: 'Invalid Rover Name' });
    }
    
    // Convert earth_date to sol if provided
    let targetSol = sol;
    if (earth_date && !sol) {
      targetSol = earthDateToSol(roverInfo.landing_date, earth_date);
      if (!targetSol || targetSol < 0) {
        return res.status(400).json({ errors: 'Invalid earth_date. Date must be after landing date.' });
      }
    }
    
    if (!targetSol && !earth_date) {
      return res.status(400).json({ errors: 'Either sol or earth_date parameter is required' });
    }
    
    const params = {
      sol: targetSol ? parseInt(targetSol) : undefined,
      camera: camera,
      page: page ? parseInt(page) : 0,
      perPage: per_page ? parseInt(per_page) : 25
    };
    
    const photos = await getPhotos(roverId, params);
    
    res.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    if (error.message.includes('not yet supported')) {
      return res.status(501).json({ errors: error.message });
    }
    res.status(500).json({ errors: 'Internal server error' });
  }
});

/**
 * GET /api/v1/rovers/:rover_id/latest_photos
 * Get latest photos for a rover
 */
router.get('/:rover_id/latest_photos', async (req, res) => {
  try {
    const roverId = req.params.rover_id;
    const { camera, page, per_page } = req.query;
    
    // Validate rover
    const roverInfo = getRoverInfo(roverId);
    if (!roverInfo) {
      return res.status(400).json({ errors: 'Invalid Rover Name' });
    }
    
    // Get latest sol
    const latestSol = await getLatestSol(roverId);
    
    const params = {
      sol: latestSol,
      camera: camera,
      page: page ? parseInt(page) : 0,
      perPage: per_page ? parseInt(per_page) : 25
    };
    
    const photos = await getPhotos(roverId, params);
    
    res.json({ latest_photos: photos });
  } catch (error) {
    console.error('Error fetching latest photos:', error);
    if (error.message.includes('not yet supported')) {
      return res.status(501).json({ errors: error.message });
    }
    res.status(500).json({ errors: 'Internal server error' });
  }
});

// Helper functions
function calculateMaxDate(landingDate, maxSol) {
  const SECONDS_PER_SOL = 88775.244;
  const SECONDS_PER_DAY = 86400;
  const landing = new Date(landingDate);
  const earthDaysSinceLanding = (maxSol * SECONDS_PER_SOL) / SECONDS_PER_DAY;
  const maxDate = new Date(landing.getTime() + earthDaysSinceLanding * 24 * 60 * 60 * 1000);
  return maxDate.toISOString().split('T')[0];
}

function earthDateToSol(landingDate, earthDate) {
  const SECONDS_PER_SOL = 88775.244;
  const SECONDS_PER_DAY = 86400;
  const landing = new Date(landingDate);
  const target = new Date(earthDate);
  const diffMs = target.getTime() - landing.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const sol = Math.round((diffDays * SECONDS_PER_DAY) / SECONDS_PER_SOL);
  return sol;
}

module.exports = router;

