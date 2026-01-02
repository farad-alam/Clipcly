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

async function safeFetch(url: string, options: RequestInit = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`RapidAPI Status ${response.status}: ${errorText.substring(0, 100)}`);
        }
        const data = await response.json();

        // Handle specific TikTok API error fields
        if (data.error || (data.code && data.code !== 0 && data.code !== 200)) {
            throw new Error(data.error || data.msg || data.message || "TikTok API error");
        }
        return data;
    } catch (e: any) {
        console.error("TikTok API Networking Error:", e.message);
        throw e;
    }
}

export async function searchTikTokVideos(keyword: string): Promise<TikTokVideo[]> {
    try {
        const data = await safeFetch(
            `https://${RAPIDAPI_HOST}/api/search/video?keyword=${encodeURIComponent(keyword)}&cursor=0&search_id=0`,
            {
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY!,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                },
                next: { revalidate: 3600 }
            }
        );

        const videoList = data.item_list || data.data?.videos || data.videos || data.data?.list || data.list || [];
        if (!Array.isArray(videoList)) return [];

        return videoList.map((v: any) => {
            const handle = v.author?.uniqueId || v.author?.unique_id || v.author?.nickname?.replace(/\s+/g, '_') || "user";
            const videoId = v.id || v.video_id || v.aweme_id;
            const s = v.stats || v.statistics || v.statsV2 || {};

            return {
                id: videoId || Math.random().toString(),
                video_id: videoId || "",
                title: v.desc || v.description || v.title || "",
                description: v.desc || v.description || v.title || "",
                cover: v.video?.originCover || v.video?.cover || v.cover || v.video?.origin_cover || v.video?.cover?.url_list?.[0] || "",
                play_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.play_addr?.url_list?.[0] || "",
                download_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.download_addr?.url_list?.[0] || "",
                share_url: v.share_url || `https://www.tiktok.com/@${handle}/video/${videoId}`,
                duration: v.video?.duration || v.duration || 0,
                author: {
                    unique_id: handle,
                    nickname: v.author?.nickname || handle,
                    avatar: v.author?.avatarThumb || v.author?.avatar_thumb || v.author?.avatar || v.author?.avatar_thumb?.url_list?.[0] || ""
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
        console.error('searchTikTokVideos Fail:', error);
        return [];
    }
}

export async function getTrendingVideos(): Promise<TikTokVideo[]> {
    try {
        const data = await safeFetch(
            `https://${RAPIDAPI_HOST}/api/post/trending?count=10`,
            {
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY!,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                },
                next: { revalidate: 3600 }
            }
        );

        const videoList = data.item_list || data.data?.videos || data.videos || data.data?.list || data.list || [];
        if (!Array.isArray(videoList)) return [];

        return videoList.map((v: any) => {
            const handle = v.author?.uniqueId || v.author?.unique_id || v.author?.nickname?.replace(/\s+/g, '_') || "user";
            const videoId = v.id || v.video_id || v.aweme_id;
            const s = v.stats || v.statistics || v.statsV2 || {};

            return {
                id: videoId || Math.random().toString(),
                video_id: videoId || "",
                title: v.desc || v.description || v.title || "",
                description: v.desc || v.description || v.title || "",
                cover: v.video?.originCover || v.video?.cover || v.cover || v.video?.origin_cover || v.video?.cover?.url_list?.[0] || "",
                play_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.play_addr?.url_list?.[0] || "",
                download_url: v.video?.downloadAddr || v.video?.playAddr || v.play || v.video?.download_addr?.url_list?.[0] || "",
                share_url: v.share_url || `https://www.tiktok.com/@${handle}/video/${videoId}`,
                duration: v.video?.duration || v.duration || 0,
                author: {
                    unique_id: handle,
                    nickname: v.author?.nickname || handle,
                    avatar: v.author?.avatarThumb || v.author?.avatar_thumb || v.author?.avatar || v.author?.avatar_thumb?.url_list?.[0] || ""
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
        console.error('getTrendingVideos Fail:', error);
        return [];
    }
}

export async function getVideoDownloadUrl(videoUrl: string, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
        try {
            console.log(`[TikTok Lib] Attempt ${i + 1} to fetch download URL for: ${videoUrl}`);
            const data = await safeFetch(
                `https://${RAPIDAPI_HOST}/api/download/video?url=${encodeURIComponent(videoUrl)}`,
                {
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY!,
                        'X-RapidAPI-Host': RAPIDAPI_HOST
                    },
                    cache: 'no-store'
                }
            );

            const downloadUrl = data.data?.play || data.play || data.data?.download_url || data.download_url || "";
            if (!downloadUrl) {
                if (i < retries) {
                    console.warn(`[TikTok Lib] Empty response structure, retrying... (${i + 1}/${retries})`);
                    await new Promise(r => setTimeout(r, 1500 * (i + 1)));
                    continue;
                }
                throw new Error('Could not find download URL in TikTok API response');
            }

            console.log(`[TikTok Lib] Successfully retrieved download URL on attempt ${i + 1}`);
            return downloadUrl;
        } catch (error: any) {
            console.error(`[TikTok Lib] Attempt ${i + 1} failed:`, error.message);
            if (i === retries) throw error;
            // Wait before retry
            await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        }
    }
    throw new Error('Unexpected fallthrough in retry logic');
}
