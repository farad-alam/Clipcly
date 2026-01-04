'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Loader2 } from "lucide-react"
import { PinterestPin } from "@/lib/pinterest/types"
import { bulkScheduleMedia } from "@/app/actions/automation"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface BulkScheduleModalProps {
    isOpen: boolean
    onClose: () => void
    items: PinterestPin[]
    onSuccess: () => void
}

export function BulkScheduleModal({ isOpen, onClose, items, onSuccess }: BulkScheduleModalProps) {
    const { toast } = useToast()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState("09:00")
    const [interval, setInterval] = useState<number>(60) // Minutes
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        if (!date || !time) return;

        setLoading(true);
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const startDate = new Date(date);
            startDate.setHours(hours, minutes, 0, 0);

            const res = await bulkScheduleMedia(
                items.map(item => ({
                    url: item.images.raw,
                    title: item.title,
                    author: item.author?.name || 'pinterest',
                    mediaType: 'IMAGE'
                })),
                {
                    startDate,
                    intervalMinutes: interval
                }
            );

            if (res.error) {
                toast({
                    title: "Scheduling Failed",
                    description: res.error,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Bulk Scheduling Complete",
                    description: `Successfully scheduled ${res.count} items starting from ${format(startDate, "MMM do HH:mm")}`,
                    className: "bg-green-50 border-green-200 text-green-900"
                });
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Unexpected error occurred", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Schedule ({items.length} items)</DialogTitle>
                    <DialogDescription>
                        Set a start time and interval. Items will be scheduled consecutively.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <div className="border rounded-md p-2 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Interval (min)</Label>
                            <Input
                                type="number"
                                min={15}
                                step={15}
                                value={interval}
                                onChange={(e) => setInterval(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={loading || !date}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirm Schedule
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
