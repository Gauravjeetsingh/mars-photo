const axios = require('axios');

// Rover configurations
const ROVERS = {
  curiosity: {
    name: 'Curiosity',
    landingDate: '2012-08-06',
    launchDate: '2011-11-26',
    status: 'active',
    cameras: [
      { name: 'FHAZ', fullName: 'Front Hazard Avoidance Camera' },
      { name: 'RHAZ', fullName: 'Read Hazard Avoidance Camera' },
      { name: 'MAST', fullName: 'Mast Camera' },
      { name: 'MAST_LEFT', fullName: 'Mast Camera - Left' },
      { name: 'MAST_RIGHT', fullName: 'Mast Camera - Right' },
      { name: 'CHEMCAM', fullName: 'Chemistry and Camera Complex' },
      { name: 'CHEMCAM_RMI', fullName: 'Chemistry and Camera Complex - Remote Micro Imager' },
      { name: 'MAHLI', fullName: 'Mars Hand Lens Imager' },
      { name: 'MARDI', fullName: 'Mars Descent Imager' },
      { name: 'NAVCAM', fullName: 'Navigation Camera' },
      { name: 'NAV_LEFT_A', fullName: 'Navigation Camera - Left A' },
      { name: 'NAV_RIGHT_A', fullName: 'Navigation Camera - Right A' }
    ]
  },
  perseverance: {
    name: 'Perseverance',
    landingDate: '2021-02-18',
    launchDate: '2020-07-30',
    status: 'active',
    cameras: [
      { name: 'EDL_RUCAM', fullName: 'Rover Up-Look Camera' },
      { name: 'EDL_RDCAM', fullName: 'Rover Down-Look Camera' },
      { name: 'EDL_DDCAM', fullName: 'Descent Stage Down-Look Camera' },
      { name: 'EDL_PUCAM1', fullName: 'Parachute Up-Look Camera A' },
      { name: 'EDL_PUCAM2', fullName: 'Parachute Up-Look Camera B' },
      { name: 'NAVCAM_LEFT', fullName: 'Navigation Camera - Left' },
      { name: 'NAVCAM_RIGHT', fullName: 'Navigation Camera - Right' },
      { name: 'MCZ_RIGHT', fullName: 'Mast Camera Zoom - Right' },
      { name: 'MCZ_LEFT', fullName: 'Mast Camera Zoom - Left' },
      { name: 'FRONT_HAZCAM_LEFT_A', fullName: 'Front Hazard Avoidance Camera - Left' },
      { name: 'FRONT_HAZCAM_RIGHT_A', fullName: 'Front Hazard Avoidance Camera - Right' },
      { name: 'REAR_HAZCAM_LEFT', fullName: 'Rear Hazard Avoidance Camera - Left' },
      { name: 'REAR_HAZCAM_RIGHT', fullName: 'Rear Hazard Avoidance Camera - Right' },
      { name: 'SKYCAM', fullName: 'MEDA Skycam' },
      { name: 'SHERLOC_WATSON', fullName: 'SHERLOC WATSON Camera' }
    ]
  },
  opportunity: {
    name: 'Opportunity',
    landingDate: '2004-01-25',
    launchDate: '2003-07-07',
    status: 'complete',
    cameras: [
      { name: 'FHAZ', fullName: 'Front Hazard Avoidance Camera' },
      { name: 'RHAZ', fullName: 'Read Hazard Avoidance Camera' },
      { name: 'NAVCAM', fullName: 'Navigation Camera' },
      { name: 'PANCAM', fullName: 'Panoramic Camera' },
      { name: 'MINITES', fullName: 'Miniature Thermal Emission Spectrometer (Mini-TES)' },
      { name: 'ENTRY', fullName: 'Entry, Descent, and Landing Camera' }
    ]
  },
  spirit: {
    name: 'Spirit',
    landingDate: '2004-01-04',
    launchDate: '2003-06-10',
    status: 'complete',
    cameras: [
      { name: 'FHAZ', fullName: 'Front Hazard Avoidance Camera' },
      { name: 'RHAZ', fullName: 'Read Hazard Avoidance Camera' },
      { name: 'NAVCAM', fullName: 'Navigation Camera' },
      { name: 'PANCAM', fullName: 'Panoramic Camera' },
      { name: 'MINITES', fullName: 'Miniature Thermal Emission Spectrometer (Mini-TES)' },
      { name: 'ENTRY', fullName: 'Entry, Descent, and Landing Camera' }
    ]
  }
};

/**
 * Map camera name to category (FHAZ, RHAZ, MAST)
 * Returns the category name if the camera belongs to one, otherwise returns null
 */
function getCameraCategory(cameraName) {
  if (!cameraName) return null;
  const upper = cameraName.toUpperCase();
  
  // FHAZ category: Front Hazard Avoidance Camera
  if (upper.startsWith('FHAZ') || upper.includes('FRONT_HAZ') || upper.includes('FRONT HAZ')) {
    return 'FHAZ';
  }
  
  // RHAZ category: Rear Hazard Avoidance Camera
  if (upper.startsWith('RHAZ') || upper.includes('REAR_HAZ') || upper.includes('REAR HAZ') || upper.includes('READ HAZ')) {
    return 'RHAZ';
  }
  
  // MAST category: Mast Camera
  if (upper.startsWith('MAST')) {
    return 'MAST';
  }
  
  return null;
}

/**
 * Check if a camera matches the filter category
 */
function matchesCameraFilter(cameraName, filterCategory) {
  if (!filterCategory) return true;
  
  const filterUpper = filterCategory.toUpperCase();
  const cameraCategory = getCameraCategory(cameraName);
  const cameraUpper = cameraName ? cameraName.toUpperCase() : '';
  
  // If filter is one of the three categories, match by category
  if (['FHAZ', 'RHAZ', 'MAST'].includes(filterUpper)) {
    return cameraCategory === filterUpper;
  }
  
  // Check if camera name starts with the filter value (e.g., CHEMCAM matches CHEMCAM_RMI)
  return cameraUpper.startsWith(filterUpper);
}

/**
 * Get Curiosity photos from mars.nasa.gov API
 */
async function getCuriosityPhotos(params = {}) {
  const { sol, camera, page = 0, perPage = 200 } = params;
  const baseUrl = 'https://mars.nasa.gov/api/v1/raw_image_items/';
  
  let url = `${baseUrl}?order=sol%20desc,instrument_sort%20asc,sample_type_sort%20asc,%20date_taken%20desc&per_page=${perPage}&page=${page}&condition_1=msl:mission`;
  
  if (sol !== undefined) {
    url += `&condition_2=${sol}:sol:in`;
  }
  
  try {
    const response = await axios.get(url);
    let items = response.data.items || [];
    
    // Filter by camera if specified
    if (camera) {
      items = items.filter(item => 
        item.instrument && matchesCameraFilter(item.instrument, camera)
      );
    }
    
    // Only return full resolution images
    items = items.filter(item => 
      item.extended && item.extended.sample_type === 'full'
    );
    
    return items.map((item, index) => ({
      id: `${item.sol}-${item.instrument}-${index}`,
      sol: item.sol,
      camera: {
        name: item.instrument,
        full_name: ROVERS.curiosity.cameras.find(c => c.name === item.instrument)?.fullName || item.instrument
      },
      img_src: item.https_url,
      earth_date: calculateEarthDate(ROVERS.curiosity.landingDate, item.sol),
      rover: {
        id: 5,
        name: 'Curiosity',
        landing_date: ROVERS.curiosity.landingDate,
        launch_date: ROVERS.curiosity.launchDate,
        status: ROVERS.curiosity.status
      }
    }));
  } catch (error) {
    console.error('Error fetching Curiosity photos:', error.message);
    throw error;
  }
}

/**
 * Get Perseverance photos from mars.nasa.gov RSS API
 */
async function getPerseverancePhotos(params = {}) {
  const { sol, camera } = params;
  
  try {
    let url;
    if (sol !== undefined) {
      url = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&sol=${sol}`;
    } else {
      // Get latest sol first
      const latestResponse = await axios.get('https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&latest=true');
      const latestSol = latestResponse.data.latest_sol;
      url = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&sol=${latestSol}`;
    }
    
    const response = await axios.get(url);
    let images = response.data.images || [];
    
    // Filter by camera if specified
    if (camera) {
      const cameraUpper = camera.toUpperCase();
      images = images.filter(img => 
        img.camera && img.camera.instrument && 
        img.camera.instrument.toUpperCase() === cameraUpper
      );
    }
    
    // Only return full resolution images
    images = images.filter(img => img.sample_type === 'Full');
    
    return images.map((img, index) => ({
      id: `${img.sol}-${img.camera.instrument}-${index}`,
      sol: img.sol,
      camera: {
        name: img.camera.instrument,
        full_name: ROVERS.perseverance.cameras.find(c => c.name === img.camera.instrument)?.fullName || img.camera.instrument
      },
      img_src: img.image_files.large,
      earth_date: calculateEarthDate(ROVERS.perseverance.landingDate, img.sol),
      rover: {
        id: 6,
        name: 'Perseverance',
        landing_date: ROVERS.perseverance.landingDate,
        launch_date: ROVERS.perseverance.launchDate,
        status: ROVERS.perseverance.status
      }
    }));
  } catch (error) {
    console.error('Error fetching Perseverance photos:', error.message);
    throw error;
  }
}

/**
 * Get latest sol for a rover
 */
async function getLatestSol(roverName) {
  const rover = roverName.toLowerCase();
  
  if (rover === 'curiosity') {
    try {
      const response = await axios.get('https://mars.nasa.gov/api/v1/raw_image_items/?order=sol%20desc&per_page=1&page=0&condition_1=msl:mission');
      return response.data.items[0]?.sol || 0;
    } catch (error) {
      console.error('Error fetching latest Curiosity sol:', error.message);
      return 0;
    }
  } else if (rover === 'perseverance') {
    try {
      const response = await axios.get('https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&latest=true');
      return response.data.latest_sol || 0;
    } catch (error) {
      console.error('Error fetching latest Perseverance sol:', error.message);
      return 0;
    }
  }
  
  return 0;
}

/**
 * Calculate Earth date from landing date and sol
 */
function calculateEarthDate(landingDate, sol) {
  const SECONDS_PER_SOL = 88775.244;
  const SECONDS_PER_DAY = 86400;
  const landing = new Date(landingDate);
  const earthDaysSinceLanding = (sol * SECONDS_PER_SOL) / SECONDS_PER_DAY;
  const earthDate = new Date(landing.getTime() + earthDaysSinceLanding * 24 * 60 * 60 * 1000);
  return earthDate.toISOString().split('T')[0];
}

/**
 * Get rover info
 */
function getRoverInfo(roverName) {
  const rover = roverName.toLowerCase();
  const roverData = ROVERS[rover];
  
  if (!roverData) {
    return null;
  }
  
  return {
    id: rover === 'curiosity' ? 5 : rover === 'perseverance' ? 6 : rover === 'opportunity' ? 3 : 2,
    name: roverData.name,
    landing_date: roverData.landingDate,
    launch_date: roverData.launchDate,
    status: roverData.status,
    cameras: roverData.cameras
  };
}

/**
 * Get photos for a rover (handles all rovers)
 */
async function getPhotos(roverName, params = {}) {
  const rover = roverName.toLowerCase();
  
  if (rover === 'curiosity') {
    return await getCuriosityPhotos(params);
  } else if (rover === 'perseverance') {
    return await getPerseverancePhotos(params);
  } else if (rover === 'opportunity' || rover === 'spirit') {
    // Opportunity and Spirit use HTML scraping which is complex
    // For now, return empty array with a note
    // TODO: Implement HTML scraping or find alternative API
    const roverData = ROVERS[rover];
    throw new Error(`${roverData.name} photos are not yet supported via direct API. The original app uses HTML scraping.`);
  } else {
    throw new Error(`Invalid rover name: ${roverName}`);
  }
}

module.exports = {
  getPhotos,
  getCuriosityPhotos,
  getPerseverancePhotos,
  getLatestSol,
  getRoverInfo,
  ROVERS,
  calculateEarthDate,
  getCameraCategory,
  matchesCameraFilter
};

