"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SearchBar from "@/components/trending/search-bar"
import VideoGrid from "@/components/trending/video-grid"
import { searchVideos, fetchTrending } from "@/app/actions/tiktok"
import { useToast } from "@/hooks/use-toast"
import { TikTokVideo } from "@/lib/tiktok"

export default function TrendingPage() {
    const { toast } = useToast()
    const [videos, setVideos] = useState<TikTokVideo[]>([])
    const [loading, setLoading] = useState(false)

    const handleSearch = async (keyword: string) => {
        setLoading(true)
        const result = await searchVideos(keyword)

        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            })
            setVideos([])
        } else if (result.success) {
            setVideos(result.videos)
            toast({
                title: "Success",
                description: `Found ${result.videos.length} videos for "${keyword}"`
            })
        }

        setLoading(false)
    }

    const handleLoadTrending = async () => {
        setLoading(true)
        const result = await fetchTrending()

        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            })
            setVideos([])
        } else if (result.success) {
            setVideos(result.videos)
            toast({
                title: "Success",
                description: `Loaded ${result.videos.length} trending videos`
            })
        }

        setLoading(false)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">TikTok Trending Videos</h1>
                    <p className="text-muted-foreground">Search and download trending TikTok videos</p>
                </div>

                {/* Search Bar */}
                <SearchBar
                    onSearch={handleSearch}
                    onLoadTrending={handleLoadTrending}
                    loading={loading}
                />

                {/* Disclaimer */}
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
                    <p>
                        <strong>Disclaimer:</strong> Please ensure you have the right to download and use any videos.
                        Only download content you own or have permission to use.
                    </p>
                </div>

                {/* Video Grid */}
                <VideoGrid videos={videos} loading={loading} />
            </div>
        </DashboardLayout>
    )
}
