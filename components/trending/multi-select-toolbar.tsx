'use client'

import { Button } from "@/components/ui/button"
import { X, CalendarClock } from "lucide-react"
import { PinterestPin } from "@/lib/pinterest/types"
import { BulkScheduleModal } from "./bulk-schedule-modal"
import { useState } from "react"

interface MultiSelectToolbarProps {
    selectedCount: number
    onCancel: () => void
    selectedItems: PinterestPin[]
}

export function MultiSelectToolbar({ selectedCount, onCancel, selectedItems }: MultiSelectToolbarProps) {
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4">
                <span className="font-semibold">{selectedCount} Selected</span>
                <div className="h-4 w-[1px] bg-background/20" />
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-background hover:bg-background/20 hover:text-background">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
            </div>

            <Button
                size="sm"
                className="bg-background text-foreground hover:bg-background/90"
                onClick={() => setIsScheduleModalOpen(true)}
            >
                <CalendarClock className="w-4 h-4 mr-2" />
                Schedule {selectedCount}
            </Button>

            <BulkScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                items={selectedItems}
                onSuccess={onCancel} // Exit selection mode on success
            />
        </div>
    )
}
