'use server'

import { pinterestService } from "@/lib/pinterest/service";
import { PinterestPin } from "@/lib/pinterest/types";

export async function getTrendingPinsAction(): Promise<{ data?: PinterestPin[], error?: string }> {
    try {
        const pins = await pinterestService.getTrendingPins();
        return { data: pins };
    } catch (error) {
        console.error("Failed to get trending pins:", error);
        return { error: "Failed to fetch trending pins." };
    }
}

export async function searchPinsAction(query: string): Promise<{ data?: PinterestPin[], error?: string }> {
    try {
        const pins = await pinterestService.searchPins(query);
        return { data: pins };
    } catch (error) {
        console.error("Failed to search pins:", error);
        return { error: "Failed to search pins." };
    }
}
