'use client';

import { DiscoveryItem } from "@/lib/discovery/types";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface ContentGridProps {
    items: DiscoveryItem[];
    selectedIds: string[];
    onToggle: (item: DiscoveryItem) => void;
}

export function ContentGrid({ items, selectedIds, onToggle }: ContentGridProps) {
    if (items.length === 0) {
        return <div className="text-center text-muted-foreground py-20">Start searching to find amazing content.</div>;
    }

    return (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                    <div
                        key={item.id}
                        onClick={() => onToggle(item)}
                        className={cn(
                            "relative group break-inside-avoid rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2",
                            isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground/30"
                        )}
                    >
                        {/* Image/Thumbnail */}
                        <img
                            src={item.thumbnail}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-auto object-cover"
                        />

                        {/* Overlays */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                            <span className="text-white text-xs font-medium truncate">{item.title}</span>
                            <span className="text-white/70 text-[10px] truncate">{item.source} • {item.author}</span>
                        </div>

                        {/* Type Badge */}
                        {item.type === 'video' && (
                            <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                <Play className="w-3 h-3 text-white fill-white" />
                            </div>
                        )}

                        {/* Selection Check */}
                        {isSelected && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                                ✓
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
