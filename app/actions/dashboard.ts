'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getDashboardData() {
    const { userId } = await auth()

    if (!userId) {
        return { error: 'Unauthorized' }
    }

    try {
        const posts = await prisma.post.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        const automationTasks = await prisma.automationQueue.findMany({
            where: {
                userId,
                status: { in: ['PENDING', 'PROCESSING', 'FAILED'] }
            },
            orderBy: { scheduledAt: 'asc' }
        })

        const totalPosts = await prisma.post.count({ where: { userId } })
        const scheduledPostsCount = await prisma.post.count({
            where: {
                userId,
                status: 'SCHEDULED'
            }
        })
        const publishedPostsCount = await prisma.post.count({
            where: {
                userId,
                status: 'PUBLISHED'
            }
        })
        const draftPostsCount = await prisma.post.count({
            where: {
                userId,
                status: 'DRAFT'
            }
        })

        // Combine regular posts with automation tasks for the calendar
        const combinedPosts = [
            ...posts.map(p => ({
                id: p.id,
                caption: p.caption,
                imageUrls: p.imageUrls,
                scheduledAt: p.scheduledAt,
                status: p.status,
                createdAt: p.createdAt,
                // Detection: Automation posts have a specific credit signature
                isAutomation: p.caption.includes('Credit: @') && p.caption.includes('#reels'),
                image: p.imageUrls[0] || null
            })),
            ...automationTasks.map(t => ({
                id: t.id,
                caption: (t.videoMeta as any).title || t.videoUrl,
                imageUrls: [(t.videoMeta as any).cover],
                scheduledAt: t.scheduledAt,
                status: t.status, // PENDING, PROCESSING, FAILED
                createdAt: t.createdAt,
                isAutomation: true,
                image: (t.videoMeta as any).cover || null
            }))
        ]

        return {
            stats: {
                totalPosts,
                published: publishedPostsCount,
                scheduled: scheduledPostsCount + automationTasks.filter(t => t.status === 'PENDING').length,
                drafts: draftPostsCount
            },
            posts: combinedPosts
        }
    } catch (error) {
        console.error('Dashboard Data Error:', error)
        return { error: 'Failed to fetch dashboard data' }
    }
}
