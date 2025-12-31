"use client"

import VideoCard from "./video-card"

interface TikTokVideo {
    id: string
    video_id: string
    title: string
    description: string
    cover: string
    play_url: string
    download_url?: string
    duration: number
    author: {
        unique_id: string
        nickname: string
        avatar: string
    }
    statistics: {
        play_count: number
        like_count: number
        comment_count: number
        share_count: number
    }
}

interface VideoGridProps {
    videos: TikTokVideo[]
    loading?: boolean
}

export default function VideoGrid({ videos, loading }: VideoGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="h-[500px] bg-muted animate-pulse rounded-lg"
                    />
                ))}
            </div>
        )
    }

    if (videos.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No videos found. Try searching for something!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
                <VideoCard key={video.id || video.video_id} video={video} />
            ))}
        </div>
    )
}
