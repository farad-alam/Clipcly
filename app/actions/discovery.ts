'use server'

import { searchDiscovery } from "@/lib/discovery/details";
import { DiscoveryFilters, DiscoveryItem } from "@/lib/discovery/types";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function searchContentAction(query: string, sources: string[] = ['unsplash', 'pexels', 'reddit']) {
    try {
        const filters: DiscoveryFilters = {
            query,
            sources: sources as any,
            types: ['image', 'video'] // Default to both
        };
        const { results, usedCache } = await searchDiscovery(filters);
        return { data: results, cached: usedCache };
    } catch (error) {
        console.error("Search Discovery Error:", error);
        return { error: "Failed to fetch content." };
    }
}

export type ScheduledItem = {
    url: string;
    thumbnail: string;
    type: 'image' | 'video';
    caption: string;
    date: Date; // ISO string or Date object
};

export async function bulkScheduleAction(items: ScheduledItem[]) {
    const user = await currentUser();
    const { userId } = await auth();

    if (!userId || !user) {
        return { error: "Unauthorized" };
    }

    try {
        // 1. Ensure User exists
        const email = user.emailAddresses[0]?.emailAddress || "no-email@example.com";
        await prisma.user.upsert({
            where: { id: userId },
            update: { email },
            create: { id: userId, email }
        });

        // 2. Create Posts in Transaction (or parallel)
        // Using transaction to be safe? Or parallel promises. Parallel is fine.
        const promises = items.map(async (item) => {
            return prisma.post.create({
                data: {
                    userId,
                    caption: item.caption,
                    imageUrls: [item.url], // Storing external URL.
                    mediaType: item.type === 'video' ? 'REEL' : 'IMAGE',
                    status: 'SCHEDULED',
                    scheduledAt: new Date(item.date),
                    // We can store thumbnail too if we extend schema, but for now imageUrls is used.
                    // Ideally we should download the asset here to prevent link rot.
                }
            });
        });

        await Promise.all(promises);

        revalidatePath('/dashboard');
        revalidatePath('/calendar');

        return { success: true, count: items.length };

    } catch (error) {
        console.error("Bulk Schedule Error:", error);
        return { error: "Failed to schedule items." };
    }
}

export async function regenerateCaptionForInstagram(originalCaption: string): Promise<{ caption?: string, error?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { error: 'Gemini API Key is missing' };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        You are an Instagram social media manager.
        Rewrite the following caption for an Instagram post.
        
        Rules:
        1. Remove ALL credits (e.g., "Credit: ...", "Photo by ...", etc.)
        2. Remove any @mentions of photographers or other users
        3. Make it engaging and catchy for Instagram
        4. Maintain the original context/meaning
        5. Add 3-5 relevant hashtags at the end
        6. Return ONLY the new caption text, nothing else
        
        Original Caption: "${originalCaption}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { caption: text.trim() };
    } catch (error) {
        console.error("Gemini Caption Regeneration Error:", error);
        return { error: "Failed to regenerate caption" };
    }
}
