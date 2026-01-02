'use server'

import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { rewriteCaption } from '@/app/actions/ai'

export async function scheduleVideo(data: {
    videoUrl: string,
    scheduledAt: Date,
    title: string,
    author: string,
    duration?: number
}) {
    try {
        const user = await currentUser()
        if (!user) {
            return { error: 'Unauthorized' }
        }

        // 1. Validation: Duration check
        // We rely on client passing duration, or we assume it's valid if missing (and check in worker)
        if (data.duration && data.duration > 180) {
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
                    duration: data.duration
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
