const ytdl = require('@distube/ytdl-core');

async function testYouTube() {
    try {
        const url = 'https://youtube.com/shorts/pQ8ixfi8s4U';
        console.log('Fetching info for:', url);

        const info = await ytdl.getInfo(url);
        const details = info.videoDetails;

        console.log('\n=== Full videoDetails object ===');
        console.log(JSON.stringify(details, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testYouTube();
