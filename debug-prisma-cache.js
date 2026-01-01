const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Cache Connection...');
    try {
        const keyword = 'test_' + Date.now();
        console.log(`Upserting cache for: ${keyword}`);

        await prisma.searchCache.upsert({
            where: { query: keyword },
            update: { results: [], updatedAt: new Date() },
            create: {
                query: keyword,
                results: [],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log('Upsert successful.');

        const cached = await prisma.searchCache.findUnique({
            where: { query: keyword }
        });

        console.log('Read successful:', !!cached);
        console.log('Cache test PASSED.');
    } catch (e) {
        console.error('Cache test FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
