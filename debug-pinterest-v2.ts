import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function debugPinterest() {
    const query = 'cat';
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                // Mimic a real browser strongly
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error("Failed to fetch.");
            return;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Check for PWS Data
        const pwsData = $('script[id="__PWS_DATA__"]').html();
        if (pwsData) {
            console.log("✅ Found __PWS_DATA__ script!");
            console.log("Length:", pwsData.length);
            // Try parsing
            try {
                const json = JSON.parse(pwsData);
                console.log("JSON Parsed successfully.");
                console.log("Keys:", Object.keys(json));
                // Inspect nested keys if possible
                if (json.props) console.log("Has json.props");
            } catch (e) {
                console.log("JSON Parse Error:", e.message);
            }
        } else {
            console.log("❌ __PWS_DATA__ NOT found.");
        }

        // 2. Check for other scripts
        const scriptTags = $('script').length;
        console.log(`Total script tags: ${scriptTags}`);
        $('script').each((i, el) => {
            const id = $(el).attr('id');
            const type = $(el).attr('type');
            if (id || type === 'application/json') {
                console.log(`Script ${i}: id="${id}", type="${type}"`);
            }
        });

        // 3. Fallback: Check for visual contents
        const images = $('img').length;
        console.log(`Total img tags: ${images}`);
        $('img').each((i, el) => {
            if (i < 3) console.log(`Img ${i}: ${$(el).attr('src')}`);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

debugPinterest();
