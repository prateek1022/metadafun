# Technical Reference - Instagram & YouTube Metadata API

## Project Overview
A minimal Node.js Express API that fetches metadata from Instagram Reels and YouTube Shorts, returning a unified JSON response format.

## Architecture

### Dependencies
- **express**: Web server framework
- **instagram-url-direct**: Library for Instagram metadata/download URLs
- **youtube-meta-data**: Library for YouTube metadata

### File Structure
```
insta-metadata-app/
├── index.js              # Main server file (ONLY production file)
├── package.json          # Dependencies
├── test-*.js            # Test files (development only)
└── test-results.json    # Test output (generated)
```

## API Endpoints

### POST /insta-metadata
**Purpose**: Fetch Instagram Reel metadata  
**Validation**: URL must contain `/reel/`  
**Library Used**: `instagram-url-direct.instagramGetUrl()`

### POST /yt-metadata
**Purpose**: Fetch YouTube Shorts metadata  
**Validation**: URL must contain `/shorts/`  
**Library Used**: `youtube-meta-data()`

## Unified Response Schema

```json
{
  "success": true,
  "data": {
    "platform": "youtube|instagram",
    "title": "string|null",
    "description": "string|null", 
    "username": "string|null",
    "category": "string|null",
    "keywords": "string|array|null",
    "urls": {
      "thumbnail": "string|null",
      "original_url": "string",
      "direct_urls": [
        {
          "url": "string",
          "quality": "240p|144p|null",
          "format": "mp4",
          "type": "video"
        }
      ]
    }
  }
}
```

## Library Response Mapping

### Instagram (`instagram-url-direct`)
**Raw Response Structure**:
- `url_list`: Array of video URLs (root level)
- `post_info.owner_username`: Instagram username
- `post_info.caption`: Full caption/description text
- `post_info.is_verified`: Verification status
- `media_details[0].type`: Content type (e.g., "video")
- `media_details[0].thumbnail`: Thumbnail URL
- `media_details[0].url`: Video URL
- `results_number`: Number of results

**Transformation**: `transformInstagramResponse()`
- Extracts hashtags from caption using regex
- Quality set to `null` (library doesn't provide quality info)

### YouTube (`youtube-meta-data`)
**Raw Response Fields**:
- `title`: Video title
- `description`: Full description
- `author` / `channel_name`: Channel info
- `category`: Video category
- `keywords`: Keywords (comma-separated string)
- `thumbnail_url`: Thumbnail URL
- `video_url`: Original video URL (NOT direct download)

**Transformation**: `transformYouTubeResponse()`

## Validation Logic

### URL Validation Functions
```javascript
isInstagramReel(url)  // Checks for '/reel/' in URL
isYouTubeShort(url)   // Checks for '/shorts/' in URL
```

### Rejected URLs
- Instagram: `/p/`, `/tv/`, stories, profiles
- YouTube: `/watch?v=`, regular videos, playlists

### Error Response
```json
{
  "success": false,
  "error": "Only [Platform] [Type] are supported"
}
```

## Quality Labels

### Instagram
- All URLs: `null` (library doesn't provide quality information)
- Format: `"mp4"`
- Type: `"video"` (from media_details)

### YouTube
- Direct download URLs: Not provided by library
- Quality: `null`

## Missing Data Handling
All missing/unavailable fields are set to `null` (not empty strings or omitted)

## Testing

### Test Files
- `run-tests.js`: Comprehensive validation + success tests
- `test-yt-simple.js`: YouTube Shorts only
- `test-insta-simple.js`: Instagram Reels only
- `test-unified.js`: Combined tests with output

### Test URLs
- **YouTube Short**: `https://www.youtube.com/shorts/eeGh0USl2Xs`
- **Instagram Reel**: `https://www.instagram.com/reel/DCLtqMKPHLO/`

### Running Tests
```bash
node run-tests.js  # Saves results to test-results.json
```

## Development Notes

### Core Principle
**DO NOT modify the core library API calls** - only add validation and transformation layers

### Code Flow
1. Validate request has URL
2. Validate URL matches platform pattern
3. Call library function (unchanged)
4. Transform response to unified format
5. Return unified JSON

### Port
Server runs on `PORT 3000`

## Future Considerations

### Known Limitations
1. **YouTube**: `youtube-meta-data` doesn't provide direct download URLs or thumbnail URLs
2. **Instagram**: Library doesn't provide quality information for videos or separate title field
3. **Validation**: Simple string matching (could be improved with regex)
4. **Instagram Keywords**: Extracted from caption hashtags, may not capture all relevant keywords

### Potential Enhancements
- Add support for more platforms
- Implement actual quality detection for Instagram
- Add caching layer
- Rate limiting
- Better error messages with specific validation failures
- Support for batch requests
