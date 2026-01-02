
import { prisma } from '@/lib/prisma';
import { InstagramClient } from '@/lib/instagram';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
    // 0. Security Check
    const authHeader = req.headers.get('authorization')
    // We allow either a valid Cron Secret OR a valid Clerk user (for manual UI triggering)
    const { userId } = await auth();

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const now = new Date();

        // 1. Find scheduled posts that are due
        // Filter by user if authenticated (manual trigger safe mode)
        const whereClause: any = {
            status: 'SCHEDULED',
            scheduledAt: {
                lte: now
            }
        };

        if (userId) {
            whereClause.userId = userId;
        }

        const postsToPublish = await prisma.post.findMany({
            where: whereClause,
            include: {
                user: {
                    include: {
                        accounts: true // We need the token
                    }
                }
            }
        });

        if (postsToPublish.length === 0) {
            return NextResponse.json({ message: 'No posts to publish' });
        }

        const results = [];

        // 2. Publish each post
        for (const post of postsToPublish) {
            try {
                const account = post.user.accounts.find(acc => acc.instagramId); // Assuming one IG account for now or we need to store which account the post is for

                if (!account) {
                    await prisma.post.update({
                        where: { id: post.id },
                        data: { status: 'FAILED' } // Or keep scheduled? FAILED is better to avoid infinite loops
                    });
                    results.push({ id: post.id, status: 'FAILED', reason: 'No Instagram account connected' });
                    continue;
                }

                // Publish First Image (For MVP) - Carousel logic needed if multiple images
                // Assuming single image for now based on create post logic
                const imageUrl = post.imageUrls[0];

                if (!imageUrl) {
                    await prisma.post.update({
                        where: { id: post.id },
                        data: { status: 'FAILED' }
                    });
                    results.push({ id: post.id, status: 'FAILED', reason: 'No image URL' });
                    continue;
                }

                if (post.mediaType === 'REEL') {
                    const publishId = await InstagramClient.publishReel(
                        account.instagramId,
                        imageUrl,
                        post.caption,
                        account.accessToken
                    );

                    // Update Status
                    await prisma.post.update({
                        where: { id: post.id },
                        data: {
                            status: 'PUBLISHED',
                            instagramPostId: publishId
                        }
                    });

                    results.push({ id: post.id, status: 'PUBLISHED', publishId, type: 'REEL' });

                } else if (post.mediaType === 'IMAGE') {
                    const publishId = await InstagramClient.publishImage(
                        account.instagramId,
                        imageUrl,
                        post.caption,
                        account.accessToken
                    );

                    // Update Status
                    await prisma.post.update({
                        where: { id: post.id },
                        data: {
                            status: 'PUBLISHED',
                            instagramPostId: publishId
                        }
                    });

                    results.push({ id: post.id, status: 'PUBLISHED', publishId, type: 'IMAGE' });
                } else if (post.mediaType === 'STORY') {
                    // Detect if story is video or image based on extension or some other flag?
                    // For now, let's assume if it ends in .mp4 or .mov it is video, else image.
                    // Or re-use the file type detection logic if possible.
                    // Ideally we should store 'MEDIA_KIND' (video/image) separate from 'POST_TYPE' (feed/reel/story).
                    // For now, simple extension check:
                    const isVideo = imageUrl.toLowerCase().match(/\.(mp4|mov|avi|wmv|flv|webm)$/);

                    const publishId = await InstagramClient.publishStoryMedia(
                        account.instagramId,
                        imageUrl,
                        isVideo ? 'VIDEO' : 'IMAGE',
                        account.accessToken
                    );

                    // Update Status
                    await prisma.post.update({
                        where: { id: post.id },
                        data: {
                            status: 'PUBLISHED',
                            instagramPostId: publishId
                        }
                    });

                    results.push({ id: post.id, status: 'PUBLISHED', publishId, type: 'STORY' });
                }

            } catch (postError: any) {
                console.error(`Failed to publish post ${post.id}`, postError);
                await prisma.post.update({
                    where: { id: post.id },
                    data: { status: 'FAILED' }
                });
                results.push({ id: post.id, status: 'FAILED', error: postError.message });
            }
        }

        return NextResponse.json({ processed: postsToPublish.length, results });

    } catch (error: any) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
