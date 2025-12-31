"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, MessageCircle, Eye, Share2, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getDownloadLink } from "@/app/actions/tiktok"

interface TikTokVideo {
    id: string
    video_id: string
    title: string
    description: string
    cover: string
    play_url: string
    download_url?: string
    share_url: string
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

interface VideoCardProps {
    video: TikTokVideo
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function VideoCard({ video }: VideoCardProps) {
    const { toast } = useToast()
    const [downloading, setDownloading] = useState(false)

    const handleDownload = async () => {
        setDownloading(true)

        try {
            // Get an authorized download link using our server action
            const result = await getDownloadLink(video.share_url)

            if (result.error || !result.downloadUrl) {
                throw new Error(result.error || 'Could not get authorized download link')
            }

            const downloadUrl = result.downloadUrl

            // Create a temporary anchor element to trigger download
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `tiktok-${video.video_id}.mp4`
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast({
                title: "Download Started",
                description: "Your authorized video download has begun."
            })
        } catch (error) {
            console.error('Download error:', error)
            toast({
                title: "Download Failed",
                description: error instanceof Error ? error.message : "Could not download the video. Please try again.",
                variant: "destructive"
            })
        } finally {
            setDownloading(false)
        }
    }

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Video Thumbnail */}
            <div className="relative aspect-[9/16] bg-black group cursor-pointer">
                <img
                    src={video.cover || '/placeholder.svg'}
                    alt={video.title || video.description}
                    className="w-full h-full object-cover"
                />

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                        {formatDuration(video.duration)}
                    </Badge>
                </div>
            </div>

            {/* Video Info */}
            <div className="p-4 space-y-3">
                {/* Author Info */}
                <div className="flex items-center gap-2">
                    <img
                        src={video.author?.avatar || '/placeholder.svg'}
                        alt={video.author?.nickname}
                        className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{video.author?.nickname}</p>
                        <p className="text-xs text-muted-foreground truncate">@{video.author?.unique_id}</p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.description || video.title}
                </p>

                {/* Statistics */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(video.statistics?.play_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{formatNumber(video.statistics?.like_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{formatNumber(video.statistics?.comment_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        <span>{formatNumber(video.statistics?.share_count || 0)}</span>
                    </div>
                </div>

                {/* Download Button */}
                <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full instagram-gradient text-white"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? "Downloading..." : "Download Video"}
                </Button>
            </div>
        </Card>
    )
}
