'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updatePostSchedule(postId: string, newDate: string) {
    const { userId } = await auth()

    if (!userId) {
        return { error: 'Unauthorized' }
    }

    try {
        const scheduledAt = new Date(newDate)

        // Simple validation to ensure date is valid
        if (isNaN(scheduledAt.getTime())) {
            return { error: 'Invalid date format' }
        }

        await prisma.post.update({
            where: {
                id: postId,
                userId // Ensure user owns the post
            },
            data: {
                scheduledAt,
                status: 'SCHEDULED' // Ensure status is scheduled
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Update Schedule Error:', error)
        return { error: 'Failed to reschedule post' }
    }
}

export async function updateScheduledPost(
    postId: string,
    caption: string,
    scheduledAt: string
) {
    const { userId } = await auth()

    if (!userId) {
        return { error: 'Unauthorized' }
    }

    try {
        const newScheduledDate = new Date(scheduledAt)

        // Validate date is valid
        if (isNaN(newScheduledDate.getTime())) {
            return { error: 'Invalid date format' }
        }

        // Validate date is in the future
        if (newScheduledDate <= new Date()) {
            return { error: 'Scheduled time must be in the future' }
        }

        // Get the post to check its status
        const post = await prisma.post.findUnique({
            where: {
                id: postId,
                userId // Ensure user owns the post
            }
        })

        if (!post) {
            return { error: 'Post not found' }
        }

        // Only allow editing SCHEDULED posts
        if (post.status === 'PUBLISHED') {
            return { error: 'Cannot edit published posts' }
        }

        // Update the post
        await prisma.post.update({
            where: {
                id: postId,
                userId
            },
            data: {
                caption,
                scheduledAt: newScheduledDate,
                status: 'SCHEDULED'
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Update Post Error:', error)
        return { error: 'Failed to update post' }
    }
}
