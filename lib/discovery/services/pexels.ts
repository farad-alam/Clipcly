import { DiscoveryItem } from "../types";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function searchPexels(query: string): Promise<DiscoveryItem[]> {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_key_here') {
        // Silently fail if no key is provided
        return [];
    }

    try {
        const headers = { Authorization: PEXELS_API_KEY };

        // Fetch Images
        const photoRes = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`,
            { headers }
        );

        if (photoRes.status === 401) {
            console.warn("Pexels API Key Invalid");
            return [];
        }

        // Fetch Videos
        const videoRes = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15`,
            { headers }
        );

        let items: DiscoveryItem[] = [];

        if (photoRes.ok) {
            const data = await photoRes.json();
            items.push(...data.photos.map((item: any) => ({
                id: String(item.id),
                source: 'pexels',
                type: 'image',
                title: item.alt || 'Pexels Photo',
                description: item.alt,
                url: item.src.original,
                thumbnail: item.src.medium,
                author: item.photographer,
                authorUrl: item.photographer_url,
                sourceLink: item.url,
                width: item.width,
                height: item.height,
            })));
        }

        if (videoRes.ok) {
            const data = await videoRes.json();
            items.push(...data.videos.map((item: any) => {
                // Find best quality video file
                const videoFile = item.video_files.sort((a: any, b: any) => b.width - a.width)[0];

                return {
                    id: String(item.id),
                    source: 'pexels',
                    type: 'video',
                    title: 'Pexels Video', // Pexels videos often lack titles in search
                    description: `Video by ${item.user.name}`,
                    url: videoFile?.link,
                    thumbnail: item.image,
                    author: item.user.name,
                    authorUrl: item.user.url,
                    sourceLink: item.url,
                    width: item.width,
                    height: item.height,
                    duration: item.duration,
                };
            }));
        }

        return items;
    } catch (error) {
        console.error("Pexels Search Exception:", error);
        return [];
    }
}
