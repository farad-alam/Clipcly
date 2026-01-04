export interface DiscoveryItem {
    id: string;
    source: 'unsplash' | 'pexels' | 'reddit';
    type: 'image' | 'video';
    title: string;
    description?: string;
    url: string;           // High-res URL (for downloading)
    thumbnail: string;     // Preview URL (for grid)
    author: string;
    authorUrl?: string;    // Credit link
    sourceLink: string;    // Link to original post
    width?: number;
    height?: number;
    duration?: number;     // For videos (in seconds)
}

export interface DiscoveryFilters {
    query: string;
    sources: ('unsplash' | 'pexels' | 'reddit')[];
    types: ('image' | 'video')[];
}
