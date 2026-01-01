const https = require('https');

const RAPIDAPI_KEY = 'd1bcdab6b1msh735b1f0c6fbe1bap1d8288jsn3d5b7e23ed9a';
const RAPIDAPI_HOST = 'tiktok-api23.p.rapidapi.com';

function request(path) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            hostname: RAPIDAPI_HOST,
            path: path,
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        };
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runDebug() {
    console.log('1. Searching for "funny"...');
    const searchData = await request('/api/search/video?keyword=funny&cursor=0&search_id=0');
    const videoList = searchData.item_list || [];

    if (videoList.length === 0) {
        console.log('No videos found.');
        return;
    }

    const v = videoList[0];
    console.log('Found video ID:', v.id);
    console.log('Author UniqueID (Raw):', v.author?.uniqueId);

    // Mimic our lib/tiktok.ts logic EXACTLY
    const handle = v.author?.uniqueId || v.author?.unique_id || v.author?.nickname?.replace(/\s+/g, '_') || "user";
    const videoId = v.id || v.video_id || v.aweme_id;
    const shareUrl = `https://www.tiktok.com/@${handle}/video/${videoId}`;

    console.log('Constructed Share URL:', shareUrl);

    console.log('2. Attempting Download...');
    try {
        const downloadData = await request(`/api/download/video?url=${encodeURIComponent(shareUrl)}`);

        if (downloadData.error) {
            console.error('API Error:', downloadData.error);
        } else {
            const downloadUrl = downloadData.data?.play || downloadData.play || downloadData.data?.download_url || downloadData.download_url;
            if (downloadUrl) {
                console.log('SUCCESS! Got download URL:', downloadUrl.substring(0, 50) + '...');
            } else {
                console.log('FAILURE. No download URL field found in:', JSON.stringify(downloadData, null, 2));
            }
        }
    } catch (e) {
        console.error('Request failed:', e);
    }
}

runDebug();
