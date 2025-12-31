'use server'

import { searchTikTokVideos, getTrendingVideos, getVideoDownloadUrl } from '@/lib/tiktok'

export async function searchVideos(keyword: string) {
    if (!keyword || keyword.trim() === '') {
        return { error: 'Please enter a search keyword' }
    }

    try {
        const videos = await searchTikTokVideos(keyword)
        return { success: true, videos }
    } catch (error) {
        console.error('Search Videos Error:', error)
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
