'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Filter, CheckSquare } from "lucide-react";
import { searchContentAction, ScheduledItem } from "@/app/actions/discovery";
import { DiscoveryItem } from "@/lib/discovery/types";
import { ContentGrid } from "./ContentGrid";
import { BulkScheduler } from "./BulkScheduler";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function DiscoveryContainer() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<DiscoveryItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<DiscoveryItem[]>([]);
    const [sources, setSources] = useState<string[]>(['unsplash', 'pexels', 'reddit']);
    const [mediaTypes, setMediaTypes] = useState<string[]>(['image', 'video']); // New: media type filter
    const [schedulerOpen, setSchedulerOpen] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);

        const res = await searchContentAction(query, sources);
        if (res.data) {
            setResults(res.data);
            if (res.cached) {
                toast.info("⚡ Displaying cached results", { duration: 2000 });
            }
        } else {
            toast.error("Failed to fetch content.");
        }
        setLoading(false);
    };

    const toggleSelection = (item: DiscoveryItem) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) return prev.filter(i => i.id !== item.id);
            return [...prev, item];
        });
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search for 'cats', 'nature', 'fitness'..."
                        className="pl-10 h-12 text-lg"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Media Type Filter */}
                    <ToggleGroup type="multiple" value={mediaTypes} onValueChange={(val) => val.length && setMediaTypes(val)}>
                        <ToggleGroupItem value="image" aria-label="Toggle Images" className="gap-2 data-[state=on]:bg-green-600 data-[state=on]:text-white">
                            {mediaTypes.includes('image') && <CheckSquare className="w-4 h-4" />}
                            Images
                        </ToggleGroupItem>
                        <ToggleGroupItem value="video" aria-label="Toggle Videos" className="gap-2 data-[state=on]:bg-purple-600 data-[state=on]:text-white">
                            {mediaTypes.includes('video') && <CheckSquare className="w-4 h-4" />}
                            Videos
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Source Filter */}
                    <ToggleGroup type="multiple" value={sources} onValueChange={(val) => val.length && setSources(val)}>
                        <ToggleGroupItem value="unsplash" aria-label="Toggle Unsplash" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            {sources.includes('unsplash') && <CheckSquare className="w-4 h-4" />}
                            Unsplash
                        </ToggleGroupItem>
                        <ToggleGroupItem value="pexels" aria-label="Toggle Pexels" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            {sources.includes('pexels') && <CheckSquare className="w-4 h-4" />}
                            Pexels
                        </ToggleGroupItem>
                        <ToggleGroupItem value="reddit" aria-label="Toggle Reddit" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            {sources.includes('reddit') && <CheckSquare className="w-4 h-4" />}
                            Reddit
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <Button onClick={handleSearch} disabled={loading} size="lg" className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Search
                </Button>
            </div>

            {/* Selection Bar (Sticky if items selected) */}
            {selectedItems.length > 0 && (
                <div className="sticky top-4 z-50 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        <span className="font-medium">{selectedItems.length} items selected</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedItems([])} className="bg-background">
                            Deselect All
                        </Button>
                        <Button variant="secondary" onClick={() => setSchedulerOpen(true)}>
                            Schedule Selected
                        </Button>
                    </div>
                </div>
            )}

            {/* Content Grid */}
            <ContentGrid
                items={results.filter(item => mediaTypes.includes(item.type))}
                selectedIds={selectedItems.map(i => i.id)}
                onToggle={toggleSelection}
            />

            {/* Bulk Scheduler Sheet/Dialog */}
            <BulkScheduler
                open={schedulerOpen}
                onOpenChange={setSchedulerOpen}
                selectedItems={selectedItems}
                onSuccess={() => {
                    setSelectedItems([]);
                    setSchedulerOpen(false);
                    toast.success("Scheduled successfully!");
                }}
            />
        </div>
    );
}
