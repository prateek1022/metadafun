const axios = require('axios');

async function test() {
    try {
        const response = await axios.post('http://localhost:3000/metadata', {
            url: 'https://youtube.com/shorts/pQ8ixfi8s4U'
        });

        console.log('\n=== FULL RESPONSE ===\n');
        console.log(JSON.stringify(response.data, null, 2));

        console.log('\n=== SPECIFIC FIELDS ===');
        console.log('Username:', response.data.data.username);
        console.log('Category:', response.data.data.category);
        console.log('Thumbnail:', response.data.data.urls.thumbnail);
        console.log('Keywords:', response.data.data.keywords);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
