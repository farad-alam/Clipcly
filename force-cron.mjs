import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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
    } catch (e) { }
}

async function forceCron() {
    loadEnv();
    console.log("🛠️ Starting Force Reprocess...");

    // 1. Reset everything that is FAILED or stuck in PROCESSING
    const resetResult = await prisma.automationQueue.updateMany({
        where: {
            status: { in: ['FAILED', 'PROCESSING'] }
        },
        data: {
            status: 'PENDING',
            updatedAt: new Date()
        }
    });

    console.log(`✅ Reset ${resetResult.count} tasks to PENDING.`);

    // 2. Trigger Cron
    const SECRET = process.env.CRON_SECRET;
    const URL = 'http://localhost:3000/api/cron/process';

    console.log(`🚀 Triggering Cron: ${URL}`);

    try {
        const response = await fetch(URL, {
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });

        const data = await response.json();
        console.log("Result:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("❌ Error triggering cron:", error.message);
    }

    await prisma.$disconnect();
}

forceCron();
