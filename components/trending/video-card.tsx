"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, MessageCircle, Eye, Share2, Play, FileUp as FileInput } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getDownloadLink } from "@/app/actions/tiktok"
import { analyzeAudio } from "@/app/actions/ai"
import { useRef } from "react"
import { Loader2, Music, Mic, AudioWaveform } from "lucide-react"

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

import { useRouter } from "next/navigation"
import { automationStore } from "@/lib/automation-store"
import { VideoSchedulePopover } from "./video-schedule-popover"

export default function VideoCard({ video }: VideoCardProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [downloading, setDownloading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [audioData, setAudioData] = useState<{ hasMusic: boolean; hasSpeech: boolean; confidence: number; description: string } | null>(null)
    const ffmpegRef = useRef<any>(null)

    const handleAnalyzeAudio = async () => {
        if (audioData) return // Already analyzed

        setAnalyzing(true)
        try {
            // 1. Load FFmpeg
            if (!ffmpegRef.current) {
                const { FFmpeg } = await import('@ffmpeg/ffmpeg')
                const { toBlobURL } = await import('@ffmpeg/util')
                const ffmpeg = new FFmpeg()
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                })
                ffmpegRef.current = ffmpeg
            }
            const ffmpeg = ffmpegRef.current

            // 2. Get Video
            const result = await getDownloadLink(video.share_url)
            if (!result.downloadUrl) throw new Error("Could not get download link")

            const res = await fetch(result.downloadUrl)
            const blob = await res.blob()
            const { fetchFile } = await import('@ffmpeg/util')

            // 3. Extract Audio (first 15s)
            const inputName = `input_${video.video_id}.mp4`
            const outputName = `audio_${video.video_id}.mp3`

            await ffmpeg.writeFile(inputName, await fetchFile(new File([blob], inputName)))

            // Extract audio, max 15 seconds, specific bitrate for compact size
            await ffmpeg.exec(['-i', inputName, '-t', '15', '-vn', '-acodec', 'libmp3lame', '-ac', '1', '-ab', '64k', '-f', 'mp3', outputName])

            const audioData = await ffmpeg.readFile(outputName)
            const audioBlob = new Blob([audioData], { type: 'audio/mp3' })

            // Cleanup
            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)

            // 4. Send to Gemini
            const reader = new FileReader()
            reader.readAsDataURL(audioBlob)
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1]
                const analysis = await analyzeAudio(base64Audio)

                if (analysis.error) throw new Error(analysis.error)
                if (analysis.data) {
                    setAudioData(analysis.data)
                    toast({
                        title: "Audio Analysis Complete",
                        description: analysis.data.description
                    })
                }
                setAnalyzing(false)
            }

        } catch (error) {
            console.error(error)
            toast({
                title: "Analysis Failed",
                description: "Could not analyze audio content.",
                variant: "destructive"
            })
            setAnalyzing(false)
        }
    }

    const handleImport = async () => {
        setImporting(true)
        try {
            // 1. Get authorized link
            const result = await getDownloadLink(video.share_url)
            if (result.error || !result.downloadUrl) {
                throw new Error(result.error || 'Could not get authorized download link')
            }

            // 2. Fetch the video blob
            const response = await fetch(result.downloadUrl)
            if (!response.ok) throw new Error('Failed to download video file')
            const blob = await response.blob()

            // 3. Store in automation store
            automationStore.setMedia(blob, {
                description: video.title || video.description,
                author: video.author.nickname
            })

            // 4. Redirect to Create page
            toast({
                title: "Importing...",
                description: "Redirecting to create post..."
            })
            router.push('/create')

        } catch (error) {
            console.error('Import error:', error)
            toast({
                title: "Import Failed",
                description: error instanceof Error ? error.message : "Could not import video.",
                variant: "destructive"
            })
            setImporting(false)
        }
    }

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

            </div>

            {/* Audio Analysis Badge */}
            {audioData && (
                <div className="flex gap-2 mb-3">
                    {audioData.hasMusic && <Badge variant="secondary" className="gap-1"><Music className="w-3 h-3" /> Music</Badge>}
                    {audioData.hasSpeech && <Badge variant="secondary" className="gap-1"><Mic className="w-3 h-3" /> Speech</Badge>}
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        size="sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        To PC
                    </Button>

                    <Button
                        onClick={handleImport}
                        disabled={importing}
                        className="w-full instagram-gradient text-white"
                        size="sm"
                    >
                        <FileInput className="w-4 h-4 mr-2" />
                        Create
                    </Button>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAnalyzeAudio}
                    disabled={analyzing || !!audioData}
                >
                    {analyzing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <AudioWaveform className="w-4 h-4 mr-2" />
                    )}
                    {analyzing ? "Analyzing..." : audioData ? "Analyzed" : "Check Audio"}
                </Button>

                <VideoSchedulePopover
                    videoUrl={video.share_url}
                    meta={{
                        title: video.description || video.title,
                        author: video.author?.nickname || "unknown",
                        duration: video.duration
                    }}
                />
            </div>
        </Card >
    )
}
