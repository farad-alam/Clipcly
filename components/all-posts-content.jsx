"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Clock, Heart, MessageCircle, Trash2 } from "lucide-react"
import { getDashboardData } from "@/app/actions/dashboard"
import { deletePost } from "@/app/actions/post"
import { useToast } from "@/hooks/use-toast"

export default function AllPostsContent() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [posts, setPosts] = useState([])
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [previewPost, setPreviewPost] = useState(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [deletePostId, setDeletePostId] = useState(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getDashboardData()
                if (data.posts) {
                    setPosts(data.posts)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [refreshTrigger])

    const handlePostClick = (post) => {
        setPreviewPost(post)
        setIsPreviewOpen(true)
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return "Not scheduled"
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            SCHEDULED: { label: "Scheduled", className: "bg-blue-500 text-white" },
            DRAFT: { label: "Draft", className: "bg-gray-500 text-white" },
            PUBLISHED: { label: "Published", className: "bg-green-500 text-white" }
        }
        return statusConfig[status] || statusConfig.DRAFT
    }

    const handleDeleteClick = (e, postId) => {
        e.stopPropagation()
        setDeletePostId(postId)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!deletePostId) return

        setIsDeleting(true)
        const result = await deletePost(deletePostId)
        setIsDeleting(false)

        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: "Success",
                description: "Post deleted successfully."
            })
            setIsDeleteDialogOpen(false)
            setDeletePostId(null)
            setRefreshTrigger(prev => prev + 1)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">All Posts</h1>
                    <p className="text-muted-foreground">Manage and preview all your Instagram posts</p>
                </div>

                <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                    {loading ? (
                        <p className="col-span-full text-center py-10">Loading posts...</p>
                    ) : posts.length === 0 ? (
                        <p className="text-muted-foreground col-span-full text-center py-10">No posts yet.</p>
                    ) : (
                        posts.map((post) => {
                            const statusBadge = getStatusBadge(post.status)
                            return (
                                <div
                                    key={post.id}
                                    className="relative aspect-[3/4] group cursor-pointer bg-muted overflow-hidden"
                                    onClick={() => handlePostClick(post)}
                                >
                                    {post.mediaType === 'REEL' ? (
                                        <video
                                            src={post.imageUrls?.[0]}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            muted
                                            playsInline
                                            onMouseOver={event => event.target.play()}
                                            onMouseOut={event => event.target.pause()}
                                        />
                                    ) : (
                                        <img
                                            src={post.imageUrls?.[0] || "/placeholder.svg"}
                                            alt="Post preview"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    )}

                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                                            <Badge className={`${statusBadge.className} text-[10px] px-1.5`}>
                                                {statusBadge.label}
                                            </Badge>
                                            {post.mediaType === 'REEL' && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 opacity-80">
                                                    Reel
                                                </Badge>
                                            )}
                                        </div>

                                        <button
                                            onClick={(e) => handleDeleteClick(e, post.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors backdrop-blur-sm z-10 pointer-events-auto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-white" />
                                        </button>

                                        <div className="absolute inset-0 flex items-center justify-center text-white">
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Heart className="w-4 h-4 fill-white" />
                                                    <span className="font-bold text-xs">0</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MessageCircle className="w-4 h-4 fill-white" />
                                                    <span className="font-bold text-xs">0</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Play icon overlay for reels when not hovering */}
                                    {post.mediaType === 'REEL' && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-0 transition-opacity">
                                            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/50">
                                                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card">
                        <DialogHeader className="p-4 pb-2 border-b border-border">
                            <DialogTitle>Post Preview</DialogTitle>
                        </DialogHeader>
                        {previewPost && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="bg-background">
                                    <div className="flex items-center gap-3 p-3">
                                        <div className="w-8 h-8 bg-primary rounded-full" />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">your_username</p>
                                            <p className="text-xs text-muted-foreground">Original Audio</p>
                                        </div>
                                    </div>
                                    <div className={`relative w-full bg-black ${previewPost.mediaType === 'REEL' ? 'aspect-[9/16]' : 'aspect-square'}`}>
                                        {previewPost.mediaType === 'REEL' ? (
                                            <video
                                                src={previewPost.imageUrls?.[0]}
                                                controls
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <img
                                                src={previewPost.imageUrls?.[0] || "/placeholder.svg"}
                                                alt="Post preview"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <Heart className="w-6 h-6" />
                                                <MessageCircle className="w-6 h-6" />
                                            </div>
                                            <Badge className={`${getStatusBadge(previewPost.status).className}`}>
                                                {getStatusBadge(previewPost.status).label}
                                            </Badge>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                <span className="font-semibold text-foreground mr-2">your_username</span>
                                                {previewPost.caption}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2 uppercase">
                                                {formatDateTime(previewPost.scheduledAt || previewPost.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this post? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    )
}
