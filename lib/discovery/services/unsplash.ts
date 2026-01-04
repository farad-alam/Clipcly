import { DiscoveryItem } from "../types";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function searchUnsplash(query: string): Promise<DiscoveryItem[]> {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'your_key_here') {
        // Silently fail if no key is provided to avoid API spam/errors
        return [];
    }

    try {
        const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30`,
            {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
            }
        );

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                console.warn("Unsplash API Invalid/Expired Key");
            } else {
                console.error("Unsplash Error:", await res.text());
            }
            return [];
        }

        const data = await res.json();
        return data.results.map((item: any) => ({
            id: item.id,
            source: 'unsplash',
            type: 'image',
            title: item.description || item.alt_description || 'Unsplash Photo',
            description: item.alt_description,
            url: item.urls.full,
            thumbnail: item.urls.small,
            author: item.user.name,
            authorUrl: item.user.links.html,
            sourceLink: item.links.html,
            width: item.width,
            height: item.height,
        }));
    } catch (error) {
        console.error("Unsplash Search Exception:", error);
        return [];
    }
}
