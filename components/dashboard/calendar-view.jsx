"use client"

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updatePostSchedule, updateScheduledPost } from '@/app/actions/calendar'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'

export function CalendarView({ posts = [], onRefresh }) {
    const { toast } = useToast()
    const router = useRouter()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false)

    // Transform posts to FullCalendar events
    const events = posts.map(post => {
        const isAutomation = post.isAutomation;
        let color = '#3b82f6'; // Default brand blue for manual scheduled posts
        let titlePrefix = isAutomation ? '🤖 ' : '';

        // Unified Color Logic
        if (post.status === 'PUBLISHED' || post.status === 'COMPLETED') {
            color = '#10b981'; // Success Green
        } else if (post.status === 'FAILED') {
            color = '#ef4444'; // Error Red
        } else if (post.status === 'PROCESSING') {
            color = '#f59e0b'; // Transition Amber
        } else if (isAutomation && post.status === 'PENDING') {
            color = '#6366f1'; // Automation Indigo
        }

        return {
            id: post.id,
            title: titlePrefix + post.caption.substring(0, 20) + (post.caption.length > 20 ? '...' : ''),
            date: post.scheduledAt || post.createdAt,
            backgroundColor: color,
            borderColor: color,
            classNames: post.status === 'PUBLISHED' ? ['published-event'] : ['scheduled-event'],
            extendedProps: {
                imageUrl: post.imageUrls?.[0],
                status: post.status,
                caption: post.caption,
                scheduledAt: post.scheduledAt,
                isAutomation: isAutomation
            }
        }
    })

    const handleEventDrop = async (info) => {
        // Optimistic update handled by FullCalendar automatically for the UI
        // We just need to sync with server

        const newDate = info.event.start.toISOString()

        toast({
            title: "Rescheduling...",
            description: "Moving post to new date."
        })

        const result = await updatePostSchedule(info.event.id, newDate)

        if (result.error) {
            info.revert() // Revert change in UI if server fails
            toast({
                title: "Error",
                description: "Failed to reschedule post.",
                variant: "destructive"
            })
        } else {
            toast({
                title: "Success",
                description: "Post rescheduled successfully."
            })
            if (onRefresh) {
                onRefresh()
            }
        }
    }

    const handleEventClick = (info) => {
        const status = info.event.extendedProps.status

        // Only allow editing SCHEDULED posts
        if (status === 'PUBLISHED') {
            toast({
                title: "Cannot Edit",
                description: "Published posts cannot be edited.",
                variant: "destructive"
            })
            return
        }

        // Open edit modal for scheduled posts
        setSelectedPost({
            id: info.event.id,
            caption: info.event.extendedProps.caption,
            scheduledAt: info.event.extendedProps.scheduledAt
        })
        setIsEditModalOpen(true)
    }

    const handleUpdatePost = async (e) => {
        e.preventDefault()
        setIsUpdating(true)

        const formData = new FormData(e.target)
        const caption = formData.get('caption')
        const scheduleDate = formData.get('scheduleDate')
        const scheduleTime = formData.get('scheduleTime')

        // Combine date and time
        const scheduledAt = `${scheduleDate}T${scheduleTime}:00`

        const result = await updateScheduledPost(selectedPost.id, caption, scheduledAt)

        setIsUpdating(false)

        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: "Success",
                description: "Scheduled post updated successfully."
            })
            setIsEditModalOpen(false)
            setSelectedPost(null)

            // Trigger data refresh
            if (onRefresh) {
                onRefresh()
            }
        }
    }

    // Format date for input fields
    const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
    }

    const formatTimeForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toTimeString().slice(0, 5)
    }

    // Get minimum datetime (current time)
    const getMinDateTime = () => {
        const now = new Date()
        return now.toISOString().split('T')[0]
    }

    return (
        <>
            <Card className="p-6 bg-card border-border">
                <div className="calendar-wrapper">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        editable={true}
                        selectable={true}
                        events={events}
                        eventDrop={handleEventDrop}
                        eventClick={handleEventClick}
                        height="auto"
                    />
                </div>
                <style jsx global>{`
        .fc {
            --fc-border-color: #1f2937;
            --fc-button-bg-color: hsl(var(--primary));
            --fc-button-border-color: hsl(var(--primary));
            --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
            --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
            --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
            --fc-button-active-border-color: hsl(var(--primary) / 0.8);
            --fc-event-bg-color: hsl(var(--primary));
            --fc-event-border-color: hsl(var(--primary));
            --fc-today-bg-color: hsl(var(--accent) / 0.1);
            --fc-neutral-bg-color: hsl(var(--background));
            --fc-page-bg-color: hsl(var(--card));
            --fc-list-event-hover-bg-color: hsl(var(--muted));
            color: hsl(var(--foreground));
        }
        
        /* Modern calendar with rounded corners and spacing */
        .fc .fc-scrollgrid {
            border: none !important;
        }
        
        .fc .fc-scrollgrid-section > * {
            border: none !important;
        }
        
        .fc .fc-scrollgrid table {
            border-collapse: separate !important;
            border-spacing: 8px !important;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
            border: none !important;
        }
        
        .fc .fc-col-header-cell {
            border: none !important;
            padding: 12px 8px !important;
        }
        
        
        /* Modern calendar with rounded corners and spacing */
        .fc .fc-scrollgrid {
            border: none !important;
        }
        
        .fc .fc-scrollgrid-section > * {
            border: none !important;
        }
        
        .fc .fc-scrollgrid table {
            border-collapse: separate !important;
            border-spacing: 8px !important;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
            border: none !important;
        }
        
        .fc .fc-col-header-cell {
            border: none !important;
            padding: 12px 8px !important;
        }
        
        /* Calendar day cells with rounded corners and spacing */
        .fc .fc-daygrid-day {
            border: 1px solid #2d3748 !important;
            border-radius: 8px !important;
            transition: border-color 0.2s ease, background-color 0.2s ease;
            min-height: 100px !important;
        }
        
        /* Hover effect on calendar cells */
        .fc .fc-daygrid-day:hover {
            border-color: hsl(var(--primary)) !important;
            background-color: hsl(var(--primary) / 0.05) !important;
        }
        
        .fc .fc-daygrid-day-frame {
            border: none !important;
            padding: 8px !important;
        }
        
        /* Day numbers with more spacing */
        .fc .fc-daygrid-day-top {
            padding: 4px 8px !important;
        }
        
        .fc-col-header-cell-cushion, 
        .fc-daygrid-day-number {
            color: hsl(var(--foreground));
            text-decoration: none !important;
            padding: 4px !important;
        }
        
        .fc-daygrid-day-number:hover {
            color: hsl(var(--primary));
        }

        /* Published events - disabled appearance */
        .fc-event.published-event {
            opacity: 0.6;
            cursor: not-allowed !important;
        }

        .fc-event.published-event .fc-event-title {
            text-decoration: line-through;
        }

        /* Scheduled events - clickable */
        .fc-event.scheduled-event {
            cursor: pointer;
        }
      `}</style>
            </Card>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Scheduled Post</DialogTitle>
                        <DialogDescription>
                            Update the caption and scheduled time for this post.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdatePost}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="caption">Caption</Label>
                                <Textarea
                                    id="caption"
                                    name="caption"
                                    defaultValue={selectedPost?.caption}
                                    placeholder="Enter your caption..."
                                    required
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduleDate">Date</Label>
                                    <Input
                                        id="scheduleDate"
                                        name="scheduleDate"
                                        type="date"
                                        defaultValue={formatDateForInput(selectedPost?.scheduledAt)}
                                        min={getMinDateTime()}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scheduleTime">Time</Label>
                                    <Input
                                        id="scheduleTime"
                                        name="scheduleTime"
                                        type="time"
                                        defaultValue={formatTimeForInput(selectedPost?.scheduledAt)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? "Updating..." : "Update Post"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
