import { DiscoveryItem } from "../types";

export async function searchReddit(query: string): Promise<DiscoveryItem[]> {
    try {
        // Search broadly across all of Reddit, sorted by relevance (or top)
        // restrict_sr=false means search everywhere
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=top&limit=30&raw_json=1`;

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.warn("Reddit Search Failed:", res.status);
            return [];
        }

        const data = await res.json();
        console.log("Reddit Raw Results:", data.data?.children?.length || 0);
        const children = data.data?.children || [];

        const items: DiscoveryItem[] = [];

        for (const child of children) {
            const post = child.data;

            // Filter for content: Must have image or video
            const isVideo = post.is_video || (post.url && post.url.includes('.mp4'));
            // Sometimes post_hint is missing but url is valid image
            const isImage = post.post_hint === 'image' || (post.url && (post.url.match(/\.(jpeg|jpg|png|gif)$/i) != null));

            if (!isVideo && !isImage) continue;

            let validUrl = post.url;
            if (isVideo && post.media?.reddit_video?.fallback_url) {
                validUrl = post.media.reddit_video.fallback_url;
            }

            items.push({
                id: post.id,
                source: 'reddit',
                type: isVideo ? 'video' : 'image',
                title: post.title,
                description: `Posted in r/${post.subreddit}`,
                url: validUrl,
                thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : validUrl, // Fallback if no thumb
                author: post.author,
                sourceLink: `https://reddit.com${post.permalink}`,
                width: isVideo ? post.media?.reddit_video?.width : undefined,
                height: isVideo ? post.media?.reddit_video?.height : undefined,
            });
        }

        return items;
    } catch (error) {
        console.error("Reddit Search Exception:", error);
        return [];
    }
}
