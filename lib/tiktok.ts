const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'tiktok-api23.p.rapidapi.com';

export interface TikTokVideo {
    id: string;
    video_id: string;
    title: string;
    description: string;
    cover: string;
    play_url: string;
    download_url: string;
    share_url: string;
    duration: number;
    author: {
        unique_id: string;
        nickname: string;
        avatar: string;
    };
    statistics: {
        play_count: number;
        like_count: number;
        comment_count: number;
        share_count: number;
    };
}

export async function searchTikTokVideos(keyword: string): Promise<TikTokVideo[]> {
    try {
        const response = await fetch(
            `https://${RAPIDAPI_HOST}/api/search/video?keyword=${encodeURIComponent(keyword)}&cursor=0&search_id=0`,
            {
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY!,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                },
                next: { revalidate: 3600 } // Cache for 1 hour
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const videoList = data.item_list || data.data?.videos || data.videos || data.data?.list || data.list || [];

        return videoList.map((v: any) => {
            // Precise handle extraction to avoid "Video not found" errors
            const handle = v.author?.uniqueId || v.author?.unique_id || v.author?.nickname?.replace(/\s+/g, '_') || "user";
            const videoId = v.id || v.video_id || v.aweme_id;

            // Statistics can be in 'stats' or 'statistics'
            const s = v.stats || v.statistics || v.statsV2 || {};

            return {
                id: videoId,
                video_id: videoId,
                title: v.desc || v.description || v.title || "",
                description: v.desc || v.description || v.title || v.desc || "",
                cover: v.video?.originCover || v.video?.cover || v.cover || v.video?.origin_cover || v.video?.cover?.url_list?.[0],
                play_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.play_addr?.url_list?.[0],
                download_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.download_addr?.url_list?.[0],
                share_url: v.share_url || `https://www.tiktok.com/@${handle}/video/${videoId}`,
                duration: v.video?.duration || v.duration || 0,
                author: {
                    unique_id: handle,
                    nickname: v.author?.nickname || handle,
                    avatar: v.author?.avatarThumb || v.author?.avatar_thumb || v.author?.avatar || v.author?.avatar_thumb?.url_list?.[0]
                },
                statistics: {
                    play_count: s.playCount || s.play_count || 0,
                    like_count: s.diggCount || s.digg_count || s.like_count || 0,
                    comment_count: s.commentCount || s.comment_count || 0,
                    share_count: s.shareCount || s.share_count || 0
                }
            };
        });
    } catch (error) {
        console.error('TikTok API Error:', error);
        throw error;
    }
}

export async function getTrendingVideos(): Promise<TikTokVideo[]> {
    try {
        const response = await fetch(
            `https://${RAPIDAPI_HOST}/api/post/trending?count=10`,
            {
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY!,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                },
                next: { revalidate: 3600 }
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const videoList = data.item_list || data.data?.videos || data.videos || data.data?.list || data.list || [];

        return videoList.map((v: any) => {
            const handle = v.author?.uniqueId || v.author?.unique_id || v.author?.nickname?.replace(/\s+/g, '_') || "user";
            const videoId = v.id || v.video_id || v.aweme_id;
            const s = v.stats || v.statistics || v.statsV2 || {};

            return {
                id: videoId,
                video_id: videoId,
                title: v.desc || v.description || v.title || "",
                description: v.desc || v.description || v.title || v.desc || "",
                cover: v.video?.originCover || v.video?.cover || v.cover || v.video?.origin_cover || v.video?.cover?.url_list?.[0],
                play_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.play_addr?.url_list?.[0],
                download_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.download_addr?.url_list?.[0],
                share_url: v.share_url || `https://www.tiktok.com/@${handle}/video/${videoId}`,
                duration: v.video?.duration || v.duration || 0,
                author: {
                    unique_id: handle,
                    nickname: v.author?.nickname || handle,
                    avatar: v.author?.avatarThumb || v.author?.avatar_thumb || v.author?.avatar || v.author?.avatar_thumb?.url_list?.[0]
                },
                statistics: {
                    play_count: s.playCount || s.play_count || 0,
                    like_count: s.diggCount || s.digg_count || s.like_count || 0,
                    comment_count: s.commentCount || s.comment_count || 0,
                    share_count: s.shareCount || s.share_count || 0
                }
            };
        });
    } catch (error) {
        console.error('TikTok API Error:', error);
        throw error;
    }
}

export async function getVideoDownloadUrl(videoUrl: string): Promise<string> {
    try {
        console.log('Fetching authorized download link for:', videoUrl);
        const response = await fetch(
            `https://${RAPIDAPI_HOST}/api/download/video?url=${encodeURIComponent(videoUrl)}`,
            {
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY!,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                },
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`TikTok API: ${data.error}`);
        }

        const downloadUrl = data.data?.play || data.play || data.data?.download_url || data.download_url || "";

        if (!downloadUrl) {
            console.error('Download response unexpected structure:', data);
            throw new Error('Could not find download URL in API response');
        }

        return downloadUrl;
    } catch (error) {
        console.error('TikTok Download Error:', error);
        throw error;
    }
}
