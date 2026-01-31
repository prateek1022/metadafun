# Instagram & YouTube Metadata API

A minimal Node.js API that fetches metadata from Instagram Reels and YouTube Shorts, returning a unified JSON response format.

## Installation

```bash
npm install
```

## Dependencies
- **express** - Web framework
- **instagram-url-direct** - Instagram metadata fetcher  
- **youtube-meta-data** - YouTube metadata fetcher

## Usage

Start the server:
```bash
node index.js
```

Server runs on `http://localhost:3000`

## API Endpoints

### POST /insta-metadata
Fetch metadata from Instagram Reels

**Validation**: Only accepts URLs containing `/reel/`

### POST /yt-metadata
Fetch metadata from YouTube Shorts

**Validation**: Only accepts URLs containing `/shorts/`

## Request Format

```json
{
  "url": "INSTAGRAM_REEL_OR_YOUTUBE_SHORT_URL"
}
```

## Unified Response Format

Both endpoints return the same structure:

```json
{
  "success": true,
  "data": {
    "platform": "instagram|youtube",
    "title": "string|null",
    "description": "string|null",
    "username": "string|null",
    "category": "string|null",
    "keywords": "array|string|null",
    "urls": {
      "thumbnail": "string|null",
      "original_url": "string",
      "direct_urls": [
        {
          "url": "string",
          "quality": "null",
          "format": "mp4",
          "type": "video"
        }
      ]
    }
  }
}
```

## Example Usage

### Instagram Reel (PowerShell)
```powershell
Invoke-RestMethod -Uri http://localhost:3000/insta-metadata -Method POST -ContentType "application/json" -Body '{"url": "https://www.instagram.com/reel/DCLtqMKPHLO/"}'
```

### YouTube Short (PowerShell)
```powershell
Invoke-RestMethod -Uri http://localhost:3000/yt-metadata -Method POST -ContentType "application/json" -Body '{"url": "https://www.youtube.com/shorts/eeGh0USl2Xs"}'
```

### Using Test Script
```bash
node run-tests.js  # Runs comprehensive tests and saves results
```

## Validation

### Accepted URLs
- **Instagram**: Only `/reel/` URLs
- **YouTube**: Only `/shorts/` URLs

### Rejected URLs
Returns error response:
```json
{
  "success": false,
  "error": "Only Instagram Reels are supported"
}
```
or
```json
{
  "success": false,
  "error": "Only YouTube Shorts are supported"
}
```

## Response Details

### Instagram
- **Title**: Always `null` (not provided by Instagram)
- **Description**: Full caption text
- **Username**: Account username (e.g., "jaipurfoodcoaster")
- **Category**: Content type (e.g., "video")
- **Keywords**: Array of hashtags extracted from caption
- **Thumbnail**: Direct thumbnail URL
- **Direct URLs**: Video download URLs (quality: `null`)

### YouTube
- **Title**: Video title
- **Description**: Full video description
- **Username**: Usually `null` (not reliably provided)
- **Category**: Usually `null`
- **Keywords**: Comma-separated string of keywords
- **Thumbnail**: Usually `null`
- **Direct URLs**: Empty array (library doesn't provide download URLs)

## Files
- `index.js` - Main server (ONLY production file)
- `TECHNICAL-REFERENCE.md` - Detailed technical documentation
- `test-*.js` - Test scripts
- `package.json` - Dependencies

## Notes
- All missing/unavailable fields are set to `null`
- Instagram keywords are extracted from caption hashtags using regex
- Quality information is `null` for both platforms (not provided by libraries)

---

For detailed technical information, see [TECHNICAL-REFERENCE.md](./TECHNICAL-REFERENCE.md)
