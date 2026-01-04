import { DiscoveryFilters, DiscoveryItem } from "./types";
import { searchUnsplash } from "./services/unsplash";
import { searchPexels } from "./services/pexels";
import { searchReddit } from "./services/reddit";
import { prisma } from "@/lib/prisma";

type SourceName = 'unsplash' | 'pexels' | 'reddit';

interface CacheData {
    sources: {
        [key in SourceName]?: DiscoveryItem[];
    };
    timestamps: {
        [key in SourceName]?: string;
    };
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function searchDiscovery(filters: DiscoveryFilters): Promise<{ results: DiscoveryItem[], usedCache: boolean }> {
    const { query, sources, types } = filters;

    // 1. Check cache
    const cached = await getCache(query);
    const now = new Date();

    // 2. Determine which sources need fresh fetching
    const sourcesToFetch: SourceName[] = [];
    const cachedResults: DiscoveryItem[] = [];

    for (const source of sources) {
        const sourceData = cached?.sources?.[source];
        const timestamp = cached?.timestamps?.[source];

        if (sourceData && timestamp) {
            const cacheAge = now.getTime() - new Date(timestamp).getTime();
            if (cacheAge < CACHE_DURATION_MS) {
                // Cache is fresh, use it
                cachedResults.push(...sourceData);
                console.log(`Using cached results for ${source}`);
            } else {
                // Cache expired
                sourcesToFetch.push(source);
            }
        } else {
            // No cache for this source
            sourcesToFetch.push(source);
        }
    }

    // 3. Fetch fresh data only for uncached/expired sources
    const freshResults: DiscoveryItem[] = [];
    const freshSourceData: Partial<CacheData['sources']> = {};
    const freshTimestamps: Partial<CacheData['timestamps']> = {};

    const promises: Promise<{ source: SourceName; items: DiscoveryItem[] }>[] = [];

    if (sourcesToFetch.includes('unsplash')) {
        promises.push(
            searchUnsplash(query).then(items => ({ source: 'unsplash' as SourceName, items }))
        );
    }

    if (sourcesToFetch.includes('pexels')) {
        promises.push(
            searchPexels(query).then(items => ({ source: 'pexels' as SourceName, items }))
        );
    }

    if (sourcesToFetch.includes('reddit')) {
        promises.push(
            searchReddit(query).then(items => ({ source: 'reddit' as SourceName, items }))
        );
    }

    const freshData = await Promise.all(promises);

    for (const { source, items } of freshData) {
        freshResults.push(...items);
        // Only cache if we got results (don't cache empty responses)
        if (items.length > 0) {
            freshSourceData[source] = items;
            freshTimestamps[source] = now.toISOString();
        }
    }

    console.log(`Fetched fresh results from: ${sourcesToFetch.join(', ')}`);

    // 4. Update cache (only if we have valid results to cache)
    if (Object.keys(freshSourceData).length > 0) {
        await updateCache(query, cached, freshSourceData, freshTimestamps);
    }

    // 5. Combine cached + fresh results
    let allResults = [...cachedResults, ...freshResults];

    // 6. Filter by type if needed
    if (types.length > 0) {
        allResults = allResults.filter(item => types.includes(item.type));
    }

    console.log("Discovery Aggregator Results:", allResults.length, "from sources:", sources);

    // 7. Shuffle results to mix sources
    const shuffled = allResults.sort(() => Math.random() - 0.5);

    return {
        results: shuffled,
        usedCache: cachedResults.length > 0 && sourcesToFetch.length === 0
    };
}

async function getCache(query: string): Promise<CacheData | null> {
    try {
        const cache = await prisma.searchCache.findUnique({
            where: { query: query.toLowerCase() }
        });

        if (!cache) return null;
        return cache.results as CacheData;
    } catch (error) {
        console.error("Cache read error:", error);
        return null;
    }
}

async function updateCache(
    query: string,
    existingCache: CacheData | null,
    freshSources: Partial<CacheData['sources']>,
    freshTimestamps: Partial<CacheData['timestamps']>
) {
    try {
        const newCacheData: CacheData = {
            sources: {
                ...(existingCache?.sources || {}),
                ...freshSources
            },
            timestamps: {
                ...(existingCache?.timestamps || {}),
                ...freshTimestamps
            }
        };

        await prisma.searchCache.upsert({
            where: { query: query.toLowerCase() },
            update: {
                results: newCacheData as any,
                updatedAt: new Date()
            },
            create: {
                query: query.toLowerCase(),
                results: newCacheData as any
            }
        });

        console.log(`Cache updated for query: "${query}"`);
    } catch (error) {
        console.error("Cache write error:", error);
    }
}
