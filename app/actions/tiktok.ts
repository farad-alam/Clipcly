'use server'

import { searchTikTokVideos, getTrendingVideos, getVideoDownloadUrl } from '@/lib/tiktok'

import { prisma } from '@/lib/prisma'

export async function searchVideos(keyword: string) {
    if (!keyword || keyword.trim() === '') {
        return { error: 'Please enter a search keyword' }
    }

    const normalizedKeyword = keyword.trim().toLowerCase()

    try {
        // 1. Check Cache (valid for 24 hours)
        const cached = await prisma.searchCache.findUnique({
            where: { query: normalizedKeyword }
        })

        if (cached) {
            const isAhFresh = (new Date().getTime() - new Date(cached.updatedAt).getTime()) < 24 * 60 * 60 * 1000
            if (isAhFresh) {
                console.log(`[CACHE HIT] Found ${normalizedKeyword}`)
                // Parse JSON if needed or just cast it, prisma handles Json type as object usually
                return { success: true, videos: cached.results }
            }
        }

        // 2. Fetch from API if no cache or expired
        console.log(`[API FETCH] Searching for ${normalizedKeyword}`)
        const videos = await searchTikTokVideos(keyword)

        // 3. Save to Cache
        await prisma.searchCache.upsert({
            where: { query: normalizedKeyword },
            update: {
                results: videos as any, // Prisma Json type
                updatedAt: new Date()
            },
            create: {
                query: normalizedKeyword,
                results: videos as any
            }
        })

        return { success: true, videos }
    } catch (error) {
        console.error('Search Videos Error:', error)
        // Fallback or error
        return { error: 'Failed to fetch videos. Please check your API key.' }
    }
}

export async function fetchTrending() {
    try {
        const videos = await getTrendingVideos()
        return { success: true, videos }
    } catch (error) {
        console.error('Fetch Trending Error:', error)
        return { error: 'Failed to fetch trending videos. Please check your API key.' }
    }
}

export async function getDownloadLink(videoUrl: string) {
    if (!videoUrl) {
        return { error: 'Invalid video URL' }
    }

    try {
        const downloadUrl = await getVideoDownloadUrl(videoUrl)
        return { success: true, downloadUrl }
    } catch (error) {
        console.error('Get Download Link Error:', error)
        return { error: 'Failed to get download link' }
    }
}
