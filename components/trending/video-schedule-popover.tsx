'use client'

import { useState } from 'react'
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { scheduleVideo } from '@/app/actions/automation'

interface VideoSchedulePopoverProps {
    videoUrl: string
    meta: {
        title: string;
        author: string;
        duration: number;
    }
}

export function VideoSchedulePopover({ videoUrl, meta }: VideoSchedulePopoverProps) {
    const { toast } = useToast()
    const [date, setDate] = useState<Date>()
    const [time, setTime] = useState<string>("09:00")
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);

    const handleSchedule = async () => {
        if (!date) {
            toast({ title: "Date required", description: "Please select a date.", variant: "destructive" })
            return;
        }
        if (!time) {
            toast({ title: "Time required", description: "Please select a time.", variant: "destructive" })
            return;
        }

        setLoading(true);

        // Combine Date and Time
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledAt = new Date(date);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const res = await scheduleVideo({
            videoUrl,
            scheduledAt,
            title: meta.title,
            author: meta.author,
            duration: meta.duration
        });

        setLoading(false);

        if (res.error) {
            toast({ title: "Scheduling Failed", description: res.error, variant: "destructive" });
        } else {
            setIsOpen(false);
            setIsScheduled(true);

            toast({
                title: "✅ Scheduled!",
                description: `Posting on ${format(scheduledAt, "MMMM do 'at' h:mm a")}`,
                className: "bg-green-50 border-green-200 text-green-900 border-2",
                duration: 5000
            });
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={isScheduled ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        isScheduled && "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 border-green-200"
                    )}
                >
                    {isScheduled ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                    {isScheduled ? "Scheduled" : "Schedule"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4 w-64">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Select Date</h4>
                        <div className="border rounded-md">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Select Time</h4>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSchedule}
                        disabled={loading || !date || !time}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Schedule
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
