import fs from 'fs';
import path from 'path';

// 1. Simple .env reader
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
    } catch (e) {
        console.error("Warning: Could not find .env file");
    }
}

async function triggerCron() {
    loadEnv();

    const SECRET = process.env.CRON_SECRET;
    const URL = 'http://localhost:3000/api/cron/process';

    console.log(`\n🚀 Manually Triggering Cron: ${URL}`);
    console.log('-----------------------------------------');

    try {
        const response = await fetch(URL, {
            headers: {
                'Authorization': `Bearer ${SECRET}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success!');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Failed');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error hitting the endpoint:', error.message);
        console.log('\nTip: Make sure your Next.js app is running with "npm run dev"');
    }
    console.log('-----------------------------------------\n');
}

triggerCron();
