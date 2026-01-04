import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InstagramClient } from '@/lib/instagram'
import { createClient } from '@supabase/supabase-js'

// Admin Supabase Client for Background Uploads
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function GET(req: NextRequest) {
    // 1. Security Check
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let currentTaskId: string | null = null;

    try {
        // 2. Fetch Pending Task (Just-in-Time)
        const task = await prisma.automationQueue.findFirst({
            where: {
                status: 'PENDING',
                scheduledAt: {
                    lte: new Date()
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        })

        if (!task) {
            return NextResponse.json({ message: 'No pending tasks' })
        }

        currentTaskId = task.id;

        // 3. Mark as Processing (Lock)
        await prisma.automationQueue.update({
            where: { id: task.id },
            data: { status: 'PROCESSING' }
        })

        // 4. Processing Logic
        const meta = task.videoMeta as any || {};
        const mediaType = meta.mediaType || 'VIDEO'; // Default to VIDEO for backward compatibility

        let publicUrl = '';

        if (mediaType === 'VIDEO') {
            const { getVideoDownloadUrl } = await import('@/lib/tiktok')
            const downloadUrl = await getVideoDownloadUrl(task.videoUrl)

            // B. Fetch Stream
            const videoRes = await fetch(downloadUrl)
            if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`)
            const videoBuffer = await videoRes.arrayBuffer()

            // C. Upload to Supabase (Direct Stream)
            const fileName = `automation/${task.userId}/${Date.now()}-${task.id}.mp4`
            const { error: uploadError } = await supabaseAdmin.storage
                .from('posts')
                .upload(fileName, videoBuffer, {
                    contentType: 'video/mp4',
                    upsert: true
                })

            if (uploadError) throw new Error(`Supabase Upload Error: ${uploadError.message}`)
            publicUrl = supabaseAdmin.storage.from('posts').getPublicUrl(fileName).data.publicUrl

        } else if (mediaType === 'IMAGE') {
            // Processing IMAGE
            const imageRes = await fetch(task.videoUrl)
            if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`)
            const imageBuffer = await imageRes.arrayBuffer()

            const fileName = `automation/${task.userId}/${Date.now()}-${task.id}.jpg`
            const { error: uploadError } = await supabaseAdmin.storage
                .from('posts')
                .upload(fileName, imageBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                })

            if (uploadError) throw new Error(`Supabase Upload Error: ${uploadError.message}`)
            publicUrl = supabaseAdmin.storage.from('posts').getPublicUrl(fileName).data.publicUrl
        }

        // D. Get User's Instagram Account
        const account = await prisma.account.findFirst({
            where: { userId: task.userId }
        })

        if (!account) throw new Error("User has no connected Instagram account")

        // E. Publish to Instagram
        const title = meta.title || meta.originalTitle || '';
        const author = meta.author || 'unknown';

        // Construct caption
        const caption = `${title}\n\nCredit: @${author} #${mediaType === 'IMAGE' ? 'pinterest' : 'reels'}`

        let creationId = '';

        if (mediaType === 'VIDEO') {
            creationId = await InstagramClient.publishReel(
                account.instagramId,
                publicUrl,
                caption,
                account.accessToken
            )
        } else {
            creationId = await InstagramClient.publishImage(
                account.instagramId,
                publicUrl,
                caption,
                account.accessToken
            )
        }

        // 5. Success
        await prisma.automationQueue.update({
            where: { id: task.id },
            data: {
                status: 'COMPLETED',
                logs: `Published successfully. ID: ${creationId}`
            }
        })

        // Create Post Record
        await prisma.post.create({
            data: {
                userId: task.userId,
                caption: caption,
                imageUrls: [publicUrl],
                mediaType: mediaType,
                status: 'PUBLISHED',
                instagramPostId: creationId,
                scheduledAt: task.scheduledAt
            }
        })

        return NextResponse.json({ success: true, taskId: task.id, creationId })

    } catch (error: any) {
        console.error("Cron Worker Error:", error)

        if (currentTaskId) {
            await prisma.automationQueue.update({
                where: { id: currentTaskId },
                data: {
                    status: 'FAILED',
                    logs: `Error: ${error.message}`
                }
            }).catch(e => console.error("Critical fail to update log:", e))
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
