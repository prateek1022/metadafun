const express = require('express');
const { instagramGetUrl } = require('instagram-url-direct');
const youtubeMeta = require('youtube-meta-data');
const axios = require('axios');
const cheerio = require('cheerio');

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

// Fetch and parse metadata from generic URLs
async function fetchGenericMetadata(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 second timeout
        });

        const $ = cheerio.load(response.data);

        // Extract metadata from various sources
        const title = $('meta[property="og:title"]').attr('content')
            || $('meta[name="twitter:title"]').attr('content')
            || $('title').text()
            || null;

        const description = $('meta[property="og:description"]').attr('content')
            || $('meta[name="twitter:description"]').attr('content')
            || $('meta[name="description"]').attr('content')
            || null;

        const thumbnail = $('meta[property="og:image"]').attr('content')
            || $('meta[name="twitter:image"]').attr('content')
            || null;

        const siteName = $('meta[property="og:site_name"]').attr('content')
            || null;

        const type = $('meta[property="og:type"]').attr('content')
            || null;

        // Extract keywords if available
        const keywordsContent = $('meta[name="keywords"]').attr('content');
        const keywords = keywordsContent
            ? keywordsContent.split(',').map(k => k.trim()).filter(k => k)
            : null;

        return {
            success: true,
            data: {
                platform: "generic",
                title: title,
                description: description,
                username: siteName,
                category: type,
                keywords: keywords,
                urls: {
                    thumbnail: thumbnail,
                    original_url: url,
                    direct_urls: []
                }
            }
        };
    } catch (error) {
        throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
}

// Unified metadata endpoint
app.post('/metadata', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        console.log('Fetching metadata for:', url);

        // Check if it's an Instagram Reel
        if (isInstagramReel(url)) {
            console.log('Detected Instagram Reel');
            const result = await instagramGetUrl(url);
            const unifiedResponse = transformInstagramResponse(result, url);
            return res.json(unifiedResponse);
        }

        // Check if it's a YouTube Short
        if (isYouTubeShort(url)) {
            console.log('Detected YouTube Short');
            const result = await youtubeMeta(url);
            console.log('YouTube result received:', result);
            const unifiedResponse = transformYouTubeResponse(result, url);
            return res.json(unifiedResponse);
        }

        // Otherwise, treat it as a generic URL
        console.log('Detected generic URL');
        const genericResponse = await fetchGenericMetadata(url);
        return res.json(genericResponse);

    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Unified endpoint: POST http://localhost:${PORT}/metadata`);
});
