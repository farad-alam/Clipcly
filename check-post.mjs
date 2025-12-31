import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const post = await prisma.post.findFirst({
    orderBy: { createdAt: 'desc' }
})

console.log('Latest post imageUrls:', post?.imageUrls)
await prisma.$disconnect()
