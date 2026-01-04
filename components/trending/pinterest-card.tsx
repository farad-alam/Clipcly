'use client'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PinterestPin } from "@/lib/pinterest/types"
import { MediaSchedulePopover } from "./media-schedule-popover"
import { ExternalLink, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PinterestCardProps {
    pin: PinterestPin;
    selected?: boolean;
    onSelect?: (pin: PinterestPin) => void;
    selectionMode?: boolean;
}

export function PinterestCard({ pin, selected, onSelect, selectionMode }: PinterestCardProps) {

    return (
        <Card className={cn(
            "overflow-hidden group relative transition-all duration-300",
            selected ? "ring-2 ring-primary border-primary shadow-lg" : "hover:shadow-md"
        )}>
            {/* Selection Overlay */}
            {selectionMode && (
                <div
                    className="absolute inset-0 z-20 cursor-pointer"
                    onClick={() => onSelect?.(pin)}
                >
                    <div className={cn(
                        "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        selected ? "bg-primary border-primary" : "bg-black/40 border-white hover:bg-black/60"
                    )}>
                        {selected && <Check className="w-4 h-4 text-white" />}
                    </div>
                </div>
            )}

            {/* Pin Image */}
            <div className="relative aspect-[236/354] bg-muted">
                <img
                    src={pin.images.grid}
                    alt={pin.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                    {pin.author?.avatar && (
                        <img src={pin.author.avatar} alt={pin.author.name} className="w-5 h-5 rounded-full" />
                    )}
                    <p className="text-xs text-muted-foreground truncate flex-1">
                        {pin.author?.name || 'Unknown'}
                    </p>
                </div>

                <p className="text-sm font-medium line-clamp-2 leading-tight">
                    {pin.title}
                </p>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2 relative z-30">
                    <MediaSchedulePopover
                        mediaUrl={pin.images.raw} // Send High Res URL
                        meta={{
                            title: pin.title,
                            author: pin.author?.name || 'pinterest',
                            mediaType: 'IMAGE'
                        }}
                    />

                    <Button variant="ghost" size="sm" asChild className="w-full text-xs h-7">
                        <a href={pin.link} target="_blank" rel="noopener noreferrer">
                            View on Pinterest <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </Button>
                </div>
            </div>
        </Card>
    )
}
