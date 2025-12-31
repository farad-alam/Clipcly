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
            take: 10
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

        // Mock analytics for now as we don't have Instagram API connected yet
        const engagement = "0"
        const comments = "0"

        return {
            stats: {
                totalPosts,
                published: publishedPostsCount,
                scheduled: scheduledPostsCount,
                drafts: draftPostsCount
            },
            posts: posts.map(p => ({
                ...p,
                scheduledFor: p.scheduledAt ? p.scheduledAt.toLocaleString() : 'Not scheduled',
                image: p.imageUrls[0] || null
            }))
        }
    } catch (error) {
        console.error('Dashboard Data Error:', error)
        return { error: 'Failed to fetch dashboard data' }
    }
}
