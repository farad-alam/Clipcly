"use client"

import { useState, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SearchBar from "@/components/trending/search-bar"
import VideoGrid from "@/components/trending/video-grid"
import { searchVideos, fetchTrending, getDownloadLink } from "@/app/actions/tiktok"
import { createPost } from "@/app/actions/post"
import { useToast } from "@/hooks/use-toast"
import { TikTokVideo } from "@/lib/tiktok"
import { Button } from "@/components/ui/button"
import { Loader2, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function TrendingPage() {
    const { toast } = useToast()
    const [videos, setVideos] = useState<TikTokVideo[]>([])
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [progress, setProgress] = useState("")

    // FFmpeg refs
    const ffmpegRef = useRef<any>(null)
    const ffmpegLoaded = useRef(false)

    const loadFFmpeg = async () => {
        if (ffmpegLoaded.current) return ffmpegRef.current

        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const { toBlobURL } = await import('@ffmpeg/util')

        const ffmpeg = new FFmpeg()
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })

        ffmpegRef.current = ffmpeg
        ffmpegLoaded.current = true
        return ffmpeg
    }

    const processBatch = async () => {
        if (videos.length === 0) return
        setProcessing(true)
        const topVideos = videos.slice(0, 3)
        let successCount = 0

        try {
            toast({ title: "Starting Batch", description: "Initializing video processor..." })
            const ffmpeg = await loadFFmpeg()
            const { fetchFile } = await import('@ffmpeg/util')

            for (const [index, video] of topVideos.entries()) {
                const stepPrefix = `Video ${index + 1}/${topVideos.length}`
                setProgress(`${stepPrefix}: Downloading...`)

                try {
                    // 1. Get Link & Download
                    const linkResult = await getDownloadLink(video.share_url)
                    if (!linkResult.downloadUrl) throw new Error("No download link")

                    const res = await fetch(linkResult.downloadUrl)
                    if (!res.ok) throw new Error("Download failed")
                    const blob = await res.blob()

                    // 2. Compress
                    setProgress(`${stepPrefix}: Optimizing...`)
                    const inputName = `input_${index}.mp4`
                    const outputName = `output_${index}.mp4`
                    const file = new File([blob], inputName, { type: 'video/mp4' })

                    await ffmpeg.writeFile(inputName, await fetchFile(file))
                    await ffmpeg.exec(['-i', inputName, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-crf', '28', '-preset', 'faster', outputName])
                    const data = await ffmpeg.readFile(outputName)
                    const compressedBlob = new Blob([data], { type: 'video/mp4' })

                    // 3. Upload to Supabase
                    setProgress(`${stepPrefix}: Uploading...`)
                    const fileName = `batch-${Date.now()}-${index}.mp4`
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('posts')
                        .upload(fileName, compressedBlob)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('posts')
                        .getPublicUrl(fileName)

                    // 4. Create Draft
                    setProgress(`${stepPrefix}: Saving Draft...`)
                    const formData = new FormData()
                    formData.append('caption', `${video.title}\n\nVia @${video.author.nickname} #tiktok`)
                    formData.append('imageUrl', publicUrl)
                    formData.append('mediaType', 'REEL')

                    const postResult = await createPost(formData)
                    if (postResult.error) throw new Error(postResult.error)

                    successCount++
                } catch (e) {
                    console.error(`Failed video ${index}`, e)
                    toast({ title: "Skip", description: `Skipped video ${index + 1}: ${e instanceof Error ? e.message : "Error"}`, variant: "destructive" })
                }

                // Cleanup partial files if possible or just let them stay in memory until page reload (ffmpeg mem is virtual)
                // ffmpeg.deleteFile(inputName).catch(() => {})
                // ffmpeg.deleteFile(outputName).catch(() => {})
            }

            toast({
                title: "Batch Complete",
                description: `Successfully saved ${successCount} drafts to your dashboard.`
            })

        } catch (e) {
            console.error(e)
            toast({ title: "Batch Failed", description: "Something went wrong initializing the processor." })
        } finally {
            setProcessing(false)
            setProgress("")
        }
    }

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
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-muted/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground flex-1">
                        <strong>Disclaimer:</strong> Only download content you own or have permission to use.
                    </p>

                    {videos.length > 0 && (
                        <Button
                            onClick={processBatch}
                            disabled={processing}
                            className="bg-primary text-primary-foreground min-w-[200px]"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {progress || "Processing..."}
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Process Top 3 (Drafts)
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Video Grid */}
                <VideoGrid videos={videos} loading={loading} />
            </div>
        </DashboardLayout>
    )
}
