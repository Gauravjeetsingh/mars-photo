# Mars Photo API - Express.js

An Express.js API that provides the same endpoints as the Rails Mars Photo API, but fetches data directly from NASA's APIs instead of using a database.

## Features

- ✅ Same API endpoints as the Rails version
- ✅ Direct integration with NASA's mars.nasa.gov APIs
- ✅ No database required
- ✅ Supports Curiosity and Perseverance rovers
- ⚠️ Opportunity and Spirit rovers not yet supported (require HTML scraping)

## API Endpoints

### Get All Rovers
```
GET /api/v1/rovers
```

### Get Specific Rover
```
GET /api/v1/rovers/:rover_id
```
Where `rover_id` is: `curiosity`, `perseverance`, `opportunity`, or `spirit`

### Get Photos by Sol
```
GET /api/v1/rovers/:rover_id/photos?sol=1000
```

### Get Photos by Earth Date
```
GET /api/v1/rovers/:rover_id/photos?earth_date=2015-06-03
```

### Get Photos by Camera
```
GET /api/v1/rovers/:rover_id/photos?sol=1000&camera=FHAZ
```

### Get Latest Photos
```
GET /api/v1/rovers/:rover_id/latest_photos
```

### Get Mission Manifest
```
GET /api/v1/manifests/:rover_id
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## Environment Variables

Create a `.env` file (optional):
```
PORT=3000
```

## Example Requests

### Get Curiosity photos from sol 1000
```bash
curl "http://localhost:3000/api/v1/rovers/curiosity/photos?sol=1000"
```

### Get Perseverance latest photos
```bash
curl "http://localhost:3000/api/v1/rovers/perseverance/latest_photos"
```

### Get photos by Earth date
```bash
curl "http://localhost:3000/api/v1/rovers/curiosity/photos?earth_date=2015-06-03"
```

### Get photos filtered by camera
```bash
curl "http://localhost:3000/api/v1/rovers/curiosity/photos?sol=1000&camera=MAST"
```

## Response Format

The API returns JSON responses matching the Rails API format:

```json
{
  "photos": [
    {
      "id": "1000-MAST-0",
      "sol": 1000,
      "camera": {
        "name": "MAST",
        "full_name": "Mast Camera"
      },
      "img_src": "https://mars.nasa.gov/msl-raw-images/...",
      "earth_date": "2015-05-30",
      "rover": {
        "id": 5,
        "name": "Curiosity",
        "landing_date": "2012-08-06",
        "launch_date": "2011-11-26",
        "status": "active"
      }
    }
  ]
}
```

## Supported Rovers

### ✅ Curiosity
- Uses: `https://mars.nasa.gov/api/v1/raw_image_items/`
- Fully supported

### ✅ Perseverance
- Uses: `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json`
- Fully supported

### ⚠️ Opportunity & Spirit
- These rovers use HTML scraping in the original app
- Not yet implemented in this Express version
- Returns 501 error with explanation

## Differences from Rails API

1. **No Database**: All data is fetched on-demand from NASA APIs
2. **Photo IDs**: Photo IDs are generated (not database IDs) in format `{sol}-{camera}-{index}`
3. **Total Photos**: Approximate calculation (not exact count)
4. **Manifest**: Simplified version (samples sols for performance)
5. **Performance**: First request may be slower as it fetches from NASA APIs

## NASA APIs Used

This app uses the same NASA APIs as the Rails scraper:

- **Curiosity**: `https://mars.nasa.gov/api/v1/raw_image_items/`
- **Perseverance**: `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json`

See `NASA_API_DOCUMENTATION.md` in the parent directory for detailed API documentation.

## Error Handling

- `400 Bad Request`: Invalid rover name or missing required parameters
- `501 Not Implemented`: Opportunity/Spirit rovers (not yet supported)
- `500 Internal Server Error`: Server error or NASA API error

## Rate Limiting

Be aware that NASA APIs may have rate limits. This app makes requests directly to NASA's servers, so:
- First requests may be slower
- Consider implementing caching for production use
- Be respectful of NASA's servers

## Deployment

This Express.js app can be deployed to any Node.js hosting platform:

- **Heroku**: Add `Procfile` with `web: node server.js`
- **Railway**: Auto-detects Node.js
- **Render**: Set build command to `npm install` and start command to `npm start`
- **Vercel/Netlify**: Configure as Node.js serverless function

## License

MIT

