import { PinterestPin, IPinterestService } from './types';
import Parser from 'rss-parser';

class PinterestServiceImpl implements IPinterestService {
    private baseUrl = 'https://www.pinterest.com';
    private parser = new Parser();

    async searchPins(query: string): Promise<PinterestPin[]> {
        // RSS Feeds don't support generic search easily, so we map queries to tags
        // or search specific curated accounts if needed.
        // However, Pinterest RSS is usually /user/feed.rss. 
        // We will try to fetch a public tag feed if possible, or fallback to known robust feeds.
        
        // Feed URL for a tag (unofficial, sometimes works): https://www.pinterest.com/feed/tag/?q=cat
        // Feed URL for a user: https://www.pinterest.com/pinterest/feed.rss
        
        // Since we can't reliably "search" via RSS, we will fetch a mix of popular feeds
        // and filter by the query if possible, or just return relevant content.
        
        try {
            // Trying "Pinterest" official account feed as a fallback source of high quality pins
            // or specific category accounts.
            const feedUrl = `https://www.pinterest.com/pinterest/feed.rss`;
            
            const feed = await this.parser.parseURL(feedUrl);
            
            const pins: PinterestPin[] = feed.items.map((item: any) => {
                // RSS item content often has HTML description with image
                const content = item.content || item['content:encoded'] || '';
                const imgMatch = content.match(/src="([^"]+)"/);
                const imgSrc = imgMatch ? imgMatch[1] : null;

                if (!imgSrc) return null;

                // High res conversion
                const highRes = imgSrc.replace('/236x/', '/originals/');

                return {
                    id: item.guid || item.link || Date.now().toString(),
                    title: item.title || 'Pinterest Pin',
                    description: item.contentSnippet || '',
                    images: {
                        raw: highRes,
                        grid: imgSrc
                    },
                    author: {
                        name: 'Pinterest',
                        username: 'pinterest',
                    },
                    link: item.link
                };
            }).filter(Boolean) as PinterestPin[];

            // Simple client-side filter
            if (query && query !== 'popular') {
                const lowerQ = query.toLowerCase();
                return pins.filter(p => 
                    p.title.toLowerCase().includes(lowerQ) || 
                    p.description?.toLowerCase().includes(lowerQ)
                );
            }
            
            return pins;

        } catch (error) {
            console.error("RSS Fetch Error:", error);
            // Fallback: Return empty to avoid crashes
            return [];
        }
    }

    async getTrendingPins(): Promise<PinterestPin[]> {
        // Use a popular account's feed for "trending"
        // e.g. 'design', 'art', 'diy' official categories if they have feeds, or just the main pinterest feed
        return this.searchPins('popular');
    }
}

// Singleton export
export const pinterestService = new PinterestServiceImpl();
