
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { InstagramClient } from '@/lib/instagram';
import { NextResponse } from 'next/server';

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = InstagramClient.getLoginUrl();
    return NextResponse.redirect(url);
}
