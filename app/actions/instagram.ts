
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { InstagramClient } from '@/lib/instagram'
import { revalidatePath } from 'next/cache'

export async function getInstagramStatus() {
    const { userId } = await auth()

    if (!userId) {
        return { isConnected: false }
    }

    try {
        const account = await prisma.account.findFirst({
            where: { userId },
            select: { username: true, picture: true }
        })

        if (account) {
            return {
                isConnected: true,
                username: account.username,
                picture: account.picture
            }
        }

        return { isConnected: false }

    } catch (error) {
        console.error('Failed to fetch Instagram status:', error)
        return { isConnected: false }
    }
}

export async function disconnectInstagram() {
    const { userId } = await auth()
    if (!userId) return { error: "Unauthorized" }

    try {
        await prisma.account.deleteMany({
            where: { userId }
        })
        revalidatePath('/connect-instagram')
        return { success: true }
    } catch (error) {
        return { error: "Failed to disconnect" }
    }
}
