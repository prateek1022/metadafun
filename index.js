const express = require('express');
const { instagramGetUrl } = require('instagram-url-direct');
const youtubeMeta = require('youtube-meta-data');

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Validation functions
function isInstagramReel(url) {
    return url.includes('/reel/');
}

function isYouTubeShort(url) {
    return url.includes('/shorts/');
}

// Transform Instagram response to unified format
function transformInstagramResponse(result, originalUrl) {
    const directUrls = [];

    // Instagram library returns data at root level with sub-objects
    const postInfo = result.post_info || {};
    const mediaDetails = result.media_details && result.media_details[0] ? result.media_details[0] : {};

    // Add video URLs - Instagram just provides plain video URLs without quality info
    if (result.url_list && Array.isArray(result.url_list)) {
        result.url_list.forEach((url) => {
            directUrls.push({
                url: url,
                quality: null,  // Instagram doesn't provide quality info
                format: "mp4",
                type: mediaDetails.type || "video"
            });
        });
    }

    // Extract hashtags from caption
    let keywords = null;
    if (postInfo.caption) {
        const hashtagMatches = postInfo.caption.match(/#\w+/g);
        if (hashtagMatches) {
            keywords = hashtagMatches.map(tag => tag.substring(1)); // Remove # symbol
        }
    }

    return {
        success: true,
        data: {
            platform: "instagram",
            title: null,  // Instagram doesn't provide a separate title
            description: postInfo.caption || null,
            username: postInfo.owner_username || null,
            category: mediaDetails.type || null,
            keywords: keywords,
            urls: {
                thumbnail: mediaDetails.thumbnail || null,
                original_url: originalUrl,
                direct_urls: directUrls
            }
        }
    };
}

// Transform YouTube response to unified format
function transformYouTubeResponse(result, originalUrl) {
    const directUrls = [];

    // YouTube metadata library doesn't provide direct download URLs
    // We'll include the video URL if available
    if (result.video_url) {
        directUrls.push({
            url: result.video_url,
            quality: null,
            format: "mp4",
            type: "video"
        });
    }

    return {
        success: true,
        data: {
            platform: "youtube",
            title: result.title || null,
            description: result.description || null,
            username: result.author || result.channel_name || null,
            category: result.category || null,
            keywords: result.keywords || null,
            urls: {
                thumbnail: result.thumbnail_url || null,
                original_url: originalUrl,
                direct_urls: directUrls
            }
        }
    };
}

app.post('/insta-metadata', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        // Validate that it's an Instagram Reel
        if (!isInstagramReel(url)) {
            return res.status(400).json({
                success: false,
                error: 'Only Instagram Reels are supported'
            });
        }

        console.log('Fetching Instagram metadata for:', url);
        const result = await instagramGetUrl(url);

        const unifiedResponse = transformInstagramResponse(result, url);
        res.json(unifiedResponse);
    } catch (error) {
        console.error('Error fetching Instagram metadata:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/yt-metadata', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        // Validate that it's a YouTube Short
        if (!isYouTubeShort(url)) {
            return res.status(400).json({
                success: false,
                error: 'Only YouTube Shorts are supported'
            });
        }

        console.log('Fetching YouTube metadata for:', url);
        const result = await youtubeMeta(url);
        console.log('YouTube result received:', result);

        const unifiedResponse = transformYouTubeResponse(result, url);
        res.json(unifiedResponse);
    } catch (error) {
        console.error('Error fetching YouTube metadata:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Test endpoint: POST http://localhost:${PORT}/insta-metadata`);
    console.log(`Test endpoint: POST http://localhost:${PORT}/yt-metadata`);
});
