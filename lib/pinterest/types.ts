export interface PinterestPin {
    id: string;
    title: string;
    description?: string;
    images: {
        raw: string;   // The original full-size image
        grid: string;  // Optimized for grid display
    };
    author?: {
        name: string;
        username: string;
        avatar?: string;
    };
    link: string; // Link to the pin on Pinterest
    board?: string;
}

export interface IPinterestService {
    /**
     * Search for pins based on a query
     * @param query The search term
     */
    searchPins(query: string): Promise<PinterestPin[]>;

    /**
     * Get trending/popular pins (convenience wrapper around search or specific endpoint)
     */
    getTrendingPins(): Promise<PinterestPin[]>;
}
