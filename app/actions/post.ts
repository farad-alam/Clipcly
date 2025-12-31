'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
    const user = await currentUser()
    const { userId } = await auth()

    if (!userId || !user) {
        return { error: 'Unauthorized' }
    }

    const caption = formData.get('caption') as string
    const imageUrl = formData.get('imageUrl') as string
    const scheduleDate = formData.get('scheduleDate') as string
    const scheduleTime = formData.get('scheduleTime') as string
    const mediaType = formData.get('mediaType') as string || 'IMAGE'

    if (!caption || !imageUrl) {
        return { error: 'Missing required fields' }
    }

    // Combine date and time if provided
    let scheduledAt = null
    let status = 'DRAFT'

    if (scheduleDate && scheduleTime) {
        scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`)
        status = 'SCHEDULED'
    }

    try {
        // 1. Ensure User exists in our DB (sync with Clerk)
        const email = user.emailAddresses[0]?.emailAddress || "no-email@example.com"

        await prisma.user.upsert({
            where: { id: userId },
            update: { email }, // Update email if it changed in Clerk
            create: {
                id: userId,
                email,
            }
        })

        // 2. Create Post
        await prisma.post.create({
            data: {
                userId,
                caption,
                imageUrls: [imageUrl], // We store video URL here for now as well since it's a string array, maybe rename locally in mind but schema is imageUrls
                scheduledAt,
                status,
                mediaType
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Create Post Error:', error)
        return { error: 'Failed to create post' }
    }
}

export async function deletePost(postId: string) {
    const { userId } = await auth()

    if (!userId) {
        return { error: 'Unauthorized' }
    }

    try {
        // Delete post only if user owns it
        await prisma.post.delete({
            where: {
                id: postId,
                userId // Ensure user owns the post
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Delete Post Error:', error)
        return { error: 'Failed to delete post' }
    }
}

export async function getMediaLibrary(mediaType: string = 'IMAGE') {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    try {
        const posts = await prisma.post.findMany({
            where: {
                userId,
                mediaType // Filter by media type
            },
            select: { imageUrls: true },
            orderBy: { createdAt: 'desc' }
        })

        // Flatten all imageUrls from all posts and get unique values
        const allImages = posts.flatMap(p => p.imageUrls)
        const uniqueImages = [...new Set(allImages)]

        return { images: uniqueImages }
    } catch (error) {
        console.error('Media Library Error:', error)
        return { error: 'Failed to fetch media library' }
    }
}
