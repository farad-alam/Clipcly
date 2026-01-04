'use server'

import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { rewriteCaption } from '@/app/actions/ai'

// Update start
export async function scheduleVideo(data: {
    videoUrl: string,
    scheduledAt: Date,
    title: string,
    author: string,
    duration?: number,
    mediaType?: 'IMAGE' | 'VIDEO' // Added optional mediaType
}) {
    try {
        const user = await currentUser()
        if (!user) {
            return { error: 'Unauthorized' }
        }

        const mediaType = data.mediaType || 'VIDEO';

        // 1. Validation: Duration check (Only for Video)
        if (mediaType === 'VIDEO' && data.duration && data.duration > 180) {
            return { error: 'Video is too long (> 3 mins). Instagram Reels limit is 90s-15 mins but commonly 3 mins for API safety.' }
        }

        // 2. Account Validation: Ensure user has a connected Instagram account
        const account = await prisma.account.findFirst({
            where: { userId: user.id }
        })

        if (!account) {
            return { error: 'Please connect your Instagram account first.' }
        }

        // 3. Schedule Validation
        if (new Date(data.scheduledAt) < new Date()) {
            return { error: 'Scheduled time must be in the future' }
        }

        // 3. AI Rewrite Caption
        let finalTitle = data.title;
        try {
            console.log('[AI] Rewriting caption...');
            finalTitle = await rewriteCaption(data.title);
            console.log('[AI] New Caption:', finalTitle);
        } catch (e) {
            console.error('[AI] Rewrite failed, using original:', e);
        }

        // 4. Create Queue Item
        await prisma.automationQueue.create({
            data: {
                userId: user.id,
                videoUrl: data.videoUrl,
                scheduledAt: data.scheduledAt,
                videoMeta: {
                    title: finalTitle, // AI Rewritten Caption
                    originalTitle: data.title,
                    author: data.author,
                    duration: data.duration,
                    mediaType: mediaType // Save media type
                } as any, // Prisma Json
                status: 'PENDING'
            }
        })

        revalidatePath('/trending')
        return { success: true }
    } catch (error) {
        console.error('Schedule Video Error:', error)
        return { error: 'Failed to schedule video' }
    }
}

export async function bulkScheduleMedia(
    items: { url: string; title: string; author: string; mediaType: 'IMAGE' | 'VIDEO' }[],
    config: { startDate: Date; intervalMinutes: number }
) {
    try {
        const user = await currentUser();
        if (!user) return { error: "Unauthorized" };

        const account = await prisma.account.findFirst({
            where: { userId: user.id }
        });
        if (!account) return { error: "Please connect your Instagram account first." };

        const startTime = new Date(config.startDate);
        if (startTime < new Date()) return { error: "Start time must be in the future." };

        // Process items
        const queueItems = items.map((item, index) => {
            const scheduledAt = new Date(startTime.getTime() + index * config.intervalMinutes * 60000);
            return {
                userId: user.id,
                videoUrl: item.url,
                scheduledAt: scheduledAt,
                videoMeta: {
                    title: item.title, // Skip AI rewrite for bulk to avoid timeout/limits
                    originalTitle: item.title,
                    author: item.author,
                    mediaType: item.mediaType
                } as any,
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });

        await prisma.automationQueue.createMany({
            data: queueItems
        });

        return { success: true, count: items.length };

    } catch (error) {
        console.error("Bulk Schedule Error:", error);
        return { error: "Failed to schedule items from bulk selection." };
    }
}
