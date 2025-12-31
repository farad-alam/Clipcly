
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { InstagramClient } from '@/lib/instagram';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL(`/connect-instagram?error=${error}`, request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/connect-instagram?error=no_code', request.url));
    }

    try {
        // 1. Exchange Code for Token
        const shortToken = await InstagramClient.getAccessToken(code);

        // 2. Get Long Lived Token
        const longToken = await InstagramClient.getLongLivedToken(shortToken);

        // 3. Get Instagram Details
        const accountDetails = await InstagramClient.getInstagramAccountId(longToken);

        if (!accountDetails) {
            return NextResponse.redirect(new URL('/connect-instagram?error=no_instagram_account_found', request.url));
        }

        // 4. Get Profile Picture & Username (Optional, but nice to have)
        const profile = await InstagramClient.getInstagramUserDetails(accountDetails.instagramId, longToken);

        // 5. Save to Database
        // Ensure user exists first
        const email = user.emailAddresses[0]?.emailAddress || "no-email@example.com";
        await prisma.user.upsert({
            where: { id: userId },
            update: { email },
            create: { id: userId, email }
        });

        // Upsert Account
        await prisma.account.upsert({
            where: { instagramId: accountDetails.instagramId },
            update: {
                accessToken: longToken,
                username: profile.username || accountDetails.username,
                picture: profile.profile_picture_url,
                userId: userId // Move ownership if it existed? Or just update token.
            },
            create: {
                instagramId: accountDetails.instagramId,
                accessToken: longToken,
                username: profile.username || accountDetails.username,
                picture: profile.profile_picture_url,
                userId: userId
            }
        });

        return NextResponse.redirect(new URL('/connect-instagram?success=instagram_connected', request.url));

    } catch (err: any) {
        console.error("Instagram Auth Error:", err);
        return NextResponse.redirect(new URL(`/connect-instagram?error=${encodeURIComponent(err.message)}`, request.url));
    }
}
