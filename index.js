const express = require('express');
const { instagramGetUrl } = require('instagram-url-direct');
const { google } = require('googleapis');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');


const app = express();
const PORT = 3000;

// YouTube Data API v3 configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY
});

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

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/shorts\/)([^?&\/]+)/,
        /(?:youtube\.com\/watch\?v=)([^&]+)/,
        /(?:youtu\.be\/)([^?&\/]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Cleanup function to remove ytdl-core debug files
async function cleanupPlayerScripts() {
    // Small delay to ensure files are fully written
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const files = fs.readdirSync(__dirname);
        const playerScripts = files.filter(file => file.includes('player-script.js'));

        playerScripts.forEach(file => {
            try {
                const filePath = path.join(__dirname, file);
                fs.unlinkSync(filePath);
                console.log(`Cleaned up debug file: ${file}`);
            } catch (err) {
                // File might be locked, skip it
            }
        });
    } catch (error) {
        // Silent fail - cleanup is not critical
    }
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

    // Generate title from username
    const username = postInfo.owner_username || null;
    const title = username ? `Reel by ${username}` : "Instagram Reel";

    return {
        success: true,
        data: {
            platform: "instagram",
            title: title,
            description: postInfo.caption || null,
            username: username,
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

// Transform YouTube response to unified format (YouTube Data API v3)
function transformYouTubeResponse(videoData, originalUrl) {
    const directUrls = [];
    const snippet = videoData.snippet;

    // Include the video URL
    directUrls.push({
        url: originalUrl,
        quality: null,
        format: "mp4",
        type: "video"
    });

    // Extract keywords/tags
    const keywords = snippet.tags || null;

    // Get the best thumbnail (maxres > standard > high > medium > default)
    const thumbnails = snippet.thumbnails;
    const thumbnail = thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        null;

    // Extract channel name
    const username = snippet.channelTitle || null;

    return {
        success: true,
        data: {
            platform: "youtube",
            title: snippet.title || null,
            description: snippet.description || null,
            username: username,
            category: snippet.categoryId || null,
            keywords: keywords,
            urls: {
                thumbnail: thumbnail,
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

        // Cgfheck if it's a YouTube Short
        if (isYouTubeShort(url)) {
            console.log('Detected YouTube Short');

            // Check if API key is configured
            if (!YOUTUBE_API_KEY) {
                return res.status(500).json({
                    success: false,
                    error: 'YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable.'
                });
            }

            // Extract video ID
            const videoId = extractYouTubeVideoId(url);
            if (!videoId) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid YouTube URL - could not extract video ID'
                });
            }

            // Fetch video data from YouTube API
            const response = await youtube.videos.list({
                part: ['snippet'],
                id: [videoId]
            });

            if (!response.data.items || response.data.items.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'YouTube video not found'
                });
            }

            const videoData = response.data.items[0];
            console.log('YouTube info received for:', videoData.snippet.title);
            const unifiedResponse = transformYouTubeResponse(videoData, url);

            return res.json(unifiedResponse);
        }

        // Otherwise, treat it as a generic URL
        console.log('Detected generic URL');
        const genericResponse = await fetchGenericMetadata(url);
        return res.json(genericResponse);

    } catch (error) {
        console.error('Error fetching metadata:', error);

        // Cleanup debug files even on error (non-blocking)
        cleanupPlayerScripts().catch(() => { });

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
