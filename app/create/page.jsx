"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, Sparkles, Hash, Calendar, Clock, ImageIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { createPost, getMediaLibrary } from "@/app/actions/post"
import { getInstagramStatus } from "@/app/actions/instagram"
import { generateCaption } from "@/app/actions/ai"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { automationStore } from "@/lib/automation-store"

const suggestedHashtags = [
  "#instagram",
  "#instagood",
  // ... existing hashtags
]

export default function CreatePostPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [caption, setCaption] = useState("")
  const [topic, setTopic] = useState("")
  const [tone, setTone] = useState("professional")
  const [selectedHashtags, setSelectedHashtags] = useState([])
  const [uploadedImage, setUploadedImage] = useState(null)
  const [fileToUpload, setFileToUpload] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [date, setDate] = useState(null)
  const [scheduleTime, setScheduleTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [mediaLibrary, setMediaLibrary] = useState([])
  const [instagramProfile, setInstagramProfile] = useState(null)

  // New State for Reels
  const [mediaType, setMediaType] = useState("IMAGE") // IMAGE, REEL, STORY
  const [isCompressing, setIsCompressing] = useState(false)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const ffmpegRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      await load()

      // Check for automated import from TikTok safely
      try {
        const media = automationStore.getMedia()
        if (media && media.mediaBlob && media.source === 'tiktok') {
          await handleAutomatedImport(media)
        }
      } catch (e) {
        console.error("Auto-import initialization error:", e)
      }
    }
    init()
  }, [])

  const handleAutomatedImport = async (media) => {
    console.log("Starting automated import...")
    setMediaType("REEL")

    try {
      // Safety check for valid blob
      if (!(media.mediaBlob instanceof Blob)) {
        throw new Error("Invalid media blob")
      }

      const url = URL.createObjectURL(media.mediaBlob)
      setUploadedImage(url)

      const desc = media.meta?.description || ""
      const author = media.meta?.author || "tiktok"
      setCaption(`${desc}\n\nCredit: @${author} #tiktok #reels`)

      toast({ title: "Imported from TikTok", description: "Optimizing video for Reels..." })

      // Ensure FFmpeg is loaded before compressing
      if (!ffmpegRef.current) {
        await load()
      }

      const file = new File([media.mediaBlob], `tiktok-${Date.now()}.mp4`, { type: 'video/mp4' })
      const compressed = await compressVideo(file)
      setFileToUpload(compressed)
      toast({ title: "Ready", description: "Video imported and optimized!" })

    } catch (e) {
      console.error("Import compression failed", e)
      setFileToUpload(new File([media.mediaBlob], "tiktok-import.mp4", { type: 'video/mp4' }))
      toast({ title: "Import Warning", description: "Video imported (unoptimized).", variant: "destructive" })
    }

    automationStore.clear()
  }

  const load = async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const { toBlobURL } = await import('@ffmpeg/util')

    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg()
    }

    const ffmpeg = ffmpegRef.current
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    setFfmpegLoaded(true)

    // Load Instagram Profile
    const status = await getInstagramStatus()
    if (status.isConnected) {
      setInstagramProfile({
        username: status.username,
        picture: status.picture
      })
    }
  }

  useEffect(() => {
    if (isMediaLibraryOpen) {
      async function loadMedia() {
        const result = await getMediaLibrary(mediaType) // Pass mediaType to filter
        if (result.images) {
          setMediaLibrary(result.images)
        }
      }
      loadMedia()
    }
  }, [isMediaLibraryOpen, mediaType]) // Add mediaType dependency

  // Utility to compress image using Canvas
  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1920
        const scaleSize = MAX_WIDTH / img.width
        const width = scaleSize < 1 ? MAX_WIDTH : img.width
        const height = scaleSize < 1 ? img.height * scaleSize : img.height

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile)
          } else {
            reject(new Error('Canvas is empty'))
          }
        }, 'image/jpeg', 0.7) // 0.7 quality
      }
      img.onerror = (error) => reject(error)
    })
  }

  const compressVideo = async (file) => {
    setIsCompressing(true)

    try {
      if (!ffmpegLoaded) {
        await load()
      }
      const ffmpeg = ffmpegRef.current
      const { fetchFile } = await import('@ffmpeg/util')

      const inputName = 'input.mp4'
      const outputName = 'output.mp4'

      await ffmpeg.writeFile(inputName, await fetchFile(file))

      // Compress video: scale to 720p height, crf 28 (good tradeoff), preset faster
      await ffmpeg.exec(['-i', inputName, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-crf', '28', '-preset', 'faster', outputName])

      const data = await ffmpeg.readFile(outputName)
      const compressedBlob = new Blob([data], { type: 'video/mp4' })
      const compressedFile = new File([compressedBlob], file.name, { type: 'video/mp4' })

      setIsCompressing(false)
      return compressedFile
    } catch (error) {
      console.error("Video compression error:", error)
      setIsCompressing(false)
      throw error
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsMediaLibraryOpen(false)

      if (mediaType === 'IMAGE' && file.type.startsWith('image/')) {
        try {
          // Optimistic UI update
          const reader = new FileReader()
          reader.onloadend = () => {
            setUploadedImage(reader.result)
          }
          reader.readAsDataURL(file)

          // Compress in background
          const compressed = await compressImage(file)
          setFileToUpload(compressed)
          toast({ title: "Image optimized", description: "Image compressed for faster upload." })
        } catch (error) {
          console.error("Compression failed", error)
          setFileToUpload(file) // Fallback to original
        }
      } else if (mediaType === 'STORY') {
        // STORIES can be Image or Video
        if (file.type.startsWith('image/')) {
          // Treat as Image
          const reader = new FileReader()
          reader.onloadend = () => {
            setUploadedImage(reader.result)
          }
          reader.readAsDataURL(file)
          setFileToUpload(file) // No compression for now or reuse compressImage
        } else if (file.type.startsWith('video/')) {
          // Treat as Video (limit 60s)
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = async function () {
            window.URL.revokeObjectURL(video.src)
            if (video.duration > 60) {
              toast({
                title: "Story too long",
                description: "Stories must be 60 seconds or less.",
                variant: "destructive"
              })
              setFileToUpload(null)
              setUploadedImage(null)
              return
            }
            const url = URL.createObjectURL(file)
            setUploadedImage(url)
            setFileToUpload(file) // No compression for now
          }
          video.src = URL.createObjectURL(file)
        } else {
          toast({ title: "Invalid File Type", description: "Stories can be images or videos.", variant: "destructive" })
        }

      } else if (mediaType === 'REEL' && file.type.startsWith('video/')) {
        // Check Video Duration
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = async function () {
          window.URL.revokeObjectURL(video.src)
          if (video.duration > 180) { // 3 minutes limit
            toast({
              title: "Video too long",
              description: "Reels generally must be 90 seconds or less (we allow up to 3 mins). Please trim your video.",
              variant: "destructive"
            })
            setFileToUpload(null)
            setUploadedImage(null)
            return
          }

          try {
            // Show preview immediately with blob url (no reader needed for video usually, but for upload preview)
            const url = URL.createObjectURL(file)
            setUploadedImage(url)

            // Compress Video
            toast({ title: "Compressing Video", description: "Please wait while we optimize your reel..." })
            const compressed = await compressVideo(file)
            setFileToUpload(compressed)
            toast({ title: "Video Optimized", description: "Ready for upload!" })

          } catch (error) {
            console.error("Video compression failed", error)
            setFileToUpload(file) // Fallback
            toast({ title: "Compression Failed", description: "Using original video file.", variant: "destructive" })
          }
        }
        video.src = URL.createObjectURL(file)

      } else {
        toast({ title: "Invalid File Type", description: `Please upload a valid file for ${mediaType}.`, variant: "destructive" })
      }
    }
  }

  const handleGenerateCaption = async () => {
    if (!topic) {
      toast({ title: "Topic Required", description: "Please enter a topic or title for the AI.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    const result = await generateCaption(topic, tone)
    setIsSubmitting(false)

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setCaption(result.caption)
      toast({ title: "Magic!", description: "AI generated your caption successfully." })
    }
  }

  const toggleHashtag = (hashtag) => {
    if (selectedHashtags.includes(hashtag)) {
      setSelectedHashtags(selectedHashtags.filter((h) => h !== hashtag))
    } else {
      setSelectedHashtags([...selectedHashtags, hashtag])
    }
  }

  const handleSchedulePost = async () => {
    if (isSubmitting) return
    if (isCompressing) {
      toast({ title: "Wait!", description: "Video is still compressing.", variant: "destructive" })
      return
    }

    if (!uploadedImage) {
      toast({ title: "Error", description: "Please upload or select media first", variant: "destructive" })
      return
    }
    if (!date) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" })
      return
    }
    if (!scheduleTime) {
      toast({ title: "Error", description: "Please select a time", variant: "destructive" })
      return
    }

    const scheduleDateStr = format(date, "yyyy-MM-dd")
    const combinedDateTime = new Date(`${scheduleDateStr}T${scheduleTime}:00`)

    if (combinedDateTime <= new Date()) {
      toast({
        title: "Error",
        description: "Scheduled time must be in the future",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      let finalImageUrl = uploadedImage

      // 1. Upload to Supabase ONLY if it's a new local file
      if (fileToUpload) {
        const ext = fileToUpload.name.split('.').pop()
        // Sanitize filename: Use timestamp + random string + extension to avoid "Invalid Key" errors with non-ASCII characters
        const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(cleanFileName, fileToUpload)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(cleanFileName)

        finalImageUrl = publicUrl
      }
      // Note: If using existing media from library (which are URLs), finalImageUrl is already a URL string

      // 2. Create Post in DB
      const formData = new FormData()
      formData.append('caption', caption + " " + selectedHashtags.join(" "))
      formData.append('imageUrl', finalImageUrl)
      formData.append('scheduleDate', scheduleDateStr)
      formData.append('scheduleTime', scheduleTime)
      formData.append('mediaType', mediaType)

      const result = await createPost(formData)

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
        setIsSubmitting(false)
      } else {
        toast({
          title: "Success! Post Created",
          description: "Your post has been scheduled successfully.",
          variant: "default"
        })

        // Reset form state for next post instead of redirecting
        setCaption("")
        setTopic("")
        setUploadedImage(null)
        setFileToUpload(null)
        setDate(null)
        setScheduleTime("")
        setSelectedHashtags([])
        setIsSubmitting(false)
      }

    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to create post. Check console.", variant: "destructive" })
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Post</h1>
          <p className="text-muted-foreground">Upload media, write captions, and schedule your Instagram content</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Caption */}
          <div className="space-y-6">
            {/* Post Type Toggle */}
            <div className="flex bg-muted p-1 rounded-lg">
              <button
                onClick={() => {
                  setMediaType("IMAGE")
                  setUploadedImage(null)
                  setFileToUpload(null)
                }}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  mediaType === "IMAGE" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Post
              </button>
              <button
                onClick={() => {
                  setMediaType("REEL")
                  setUploadedImage(null)
                  setFileToUpload(null)
                }}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  mediaType === "REEL" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Reel
              </button>
              <button
                onClick={() => {
                  setMediaType("STORY")
                  setUploadedImage(null)
                  setFileToUpload(null)
                }}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  mediaType === "STORY" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Story
              </button>
            </div>

            {/* Media Upload */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                Media ({mediaType === "REEL" ? "Video" : mediaType === "STORY" ? "Image/Video" : "Image"})
              </h2>

              {!uploadedImage ? (
                <div
                  onClick={() => setIsMediaLibraryOpen(true)}
                  className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="mb-2 text-sm text-card-foreground">
                      <span className="font-semibold">Click to select from Library</span> or upload new
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mediaType === 'REEL' ? "Upload MP4, MOV (Max 3 min)" : mediaType === 'STORY' ? "Upload Image or Video (Max 60s, 9:16)" : "Upload JPG, PNG"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {mediaType === 'REEL' || (mediaType === 'STORY' && uploadedImage?.toString().startsWith('blob:') && !fileToUpload?.type.startsWith('image/')) ? (
                    <video
                      src={uploadedImage}
                      controls
                      className={`w-full ${mediaType === 'REEL' || mediaType === 'STORY' ? 'h-[500px] aspect-[9/16]' : 'h-80'} object-cover rounded-lg bg-black`}
                    />
                  ) : (
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Uploaded content"
                      className={`w-full ${mediaType === 'STORY' ? 'h-[500px] aspect-[9/16]' : 'h-80'} object-cover rounded-lg`}
                    />
                  )}

                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => {
                      setUploadedImage(null)
                      setFileToUpload(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  {isCompressing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                      <p className="text-white text-sm font-medium">Compressing Video...</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Caption & AI */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">Caption</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCaption}
                  disabled={isSubmitting}
                  className="border-border text-foreground bg-transparent"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Generating..." : "AI Generate"}
                </Button>
              </div>

              <div className="grid gap-4 mb-4">
                <div>
                  <Label className="mb-2 block">Topic / Title</Label>
                  <Input
                    placeholder="e.g. New Summer Collection Launch"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-background border-input text-foreground"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-background border-input text-foreground">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="funny">Funny</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                      <SelectItem value="sales">Sales / Promotional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Textarea
                placeholder="Write your caption here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-32 bg-background border-input text-foreground resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">{caption.length} / 2200 characters</p>
            </Card>

            {/* Hashtags */}
            {/*
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Hashtag Suggestions</h2>
              </div>

              
              <div className="flex flex-wrap gap-2">
                {suggestedHashtags.map((hashtag) => (
                  <Badge
                    key={hashtag}
                    variant={selectedHashtags.includes(hashtag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${selectedHashtags.includes(hashtag)
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary/50"
                      }`}
                    onClick={() => toggleHashtag(hashtag)}
                  >
                    {hashtag}
                  </Badge>
                ))}
              </div>
              

              {selectedHashtags.length > 0 && (
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-secondary-foreground">Selected: {selectedHashtags.join(" ")}</p>
                </div>
              )}
            </Card>
            */}
          </div>

          {/* Right Column - Schedule & Preview */}
          <div className="space-y-6">
            {/* Schedule */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold text-card-foreground">Schedule Post</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-card-foreground block">
                    Select Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background border-input",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground block">
                    Select Time
                  </Label>
                  <Select value={scheduleTime} onValueChange={setScheduleTime}>
                    <SelectTrigger className="bg-background border-input text-foreground">
                      <SelectValue placeholder="Pick a time" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border max-h-[300px]">
                      {Array.from({ length: 24 * 4 }).map((_, i) => {
                        const h = Math.floor(i / 4)
                        const m = (i % 4) * 15
                        const hours24 = h.toString().padStart(2, '0')
                        const minutes = m.toString().padStart(2, '0')
                        const value = `${hours24}:${minutes}`

                        // 12-hour format display
                        const period = h >= 12 ? 'PM' : 'AM'
                        const hours12 = h % 12 === 0 ? 12 : h % 12
                        const label = `${hours12}:${minutes} ${period}`

                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Best Time to Post</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on your audience, we recommend posting between 10 AM - 2 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Preview */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-chart-3" />
                <h2 className="text-lg font-semibold text-card-foreground">Instagram Preview</h2>
              </div>

              <div className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={instagramProfile?.picture || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{instagramProfile?.username || "your_username"}</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>

                {uploadedImage ? (
                  mediaType === 'REEL' || (mediaType === 'STORY' && fileToUpload?.type?.startsWith('video/')) ? (
                    <div className="flex justify-center bg-black rounded-lg mb-3">
                      <video
                        src={uploadedImage}
                        className="h-[400px] w-auto aspect-[9/16] object-cover rounded-lg"
                        controls={false}
                        autoPlay
                        loop
                        muted
                      />
                    </div>
                  ) : (
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Preview"
                      className={`w-full ${mediaType === 'STORY' ? 'aspect-[9/16]' : 'aspect-square'} object-cover rounded-lg mb-3`}
                    />
                  )
                ) : (
                  <div className={`w-full ${mediaType === 'REEL' || mediaType === 'STORY' ? 'aspect-[9/16] max-h-[400px]' : 'aspect-square'} bg-secondary rounded-lg mb-3 flex items-center justify-center transition-all`}>
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}

                <p className="text-sm text-foreground line-clamp-3">{caption || "Your caption will appear here..."}</p>
                {selectedHashtags.length > 0 && (
                  <p className="text-sm text-primary mt-2">{selectedHashtags.join(" ")}</p>
                )}
              </div>

              <Button
                className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setShowPreview(true)}
              >
                Full Preview
              </Button>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 border-border text-foreground bg-transparent">
                Save Draft
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSchedulePost}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Scheduling..." : "Schedule Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col bg-card p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-card-foreground">Instagram Post Preview</DialogTitle>
            <DialogDescription>This is how your post will appear on Instagram</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto p-4">
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={instagramProfile?.picture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{instagramProfile?.username || "your_username"}</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>

              {uploadedImage && (
                mediaType === 'REEL' ? (
                  <video
                    src={uploadedImage}
                    controls
                    autoPlay
                    className="w-full aspect-[9/16] object-cover rounded-lg mb-3 bg-black"
                  />
                ) : (
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-lg mb-3"
                  />
                )
              )}

              <div className="space-y-2">
                <p className="text-sm text-foreground">{caption || "Your caption will appear here..."}</p>
                {selectedHashtags.length > 0 && <p className="text-sm text-primary">{selectedHashtags.join(" ")}</p>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Library Modal */}
      <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
        <DialogContent className="max-w-4xl bg-card max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Media Library ({mediaType === "REEL" ? "Videos" : "Images"})</DialogTitle>
            <DialogDescription>Select a previously uploaded {mediaType === "REEL" ? "video" : "image"} or upload a new one</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Upload New Card */}
              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/50">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-primary mb-2" />
                  <span className="text-xs font-semibold">Upload New</span>
                </div>
                <input type="file" className="hidden" accept={mediaType === 'REEL' ? "video/*" : "image/*"} onChange={handleImageUpload} />
              </label>

              {/* Library Images */}
              {mediaLibrary.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your library is empty</p>
                </div>
              ) : (
                mediaLibrary.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setUploadedImage(url)
                      setFileToUpload(null)
                      setIsMediaLibraryOpen(false)
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all group bg-muted"
                  >
                    {mediaType === 'REEL' ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold bg-primary/80 px-2 py-1 rounded">Select</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
