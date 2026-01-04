'use client';

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiscoveryItem } from "@/lib/discovery/types";
import { bulkScheduleAction, ScheduledItem, regenerateCaptionForInstagram } from "@/app/actions/discovery";
import { Loader2, CalendarClock, Wand2, Sparkles } from "lucide-react";
import { toast } from 'sonner';

interface BulkSchedulerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedItems: DiscoveryItem[];
    onSuccess: () => void;
}

interface DraftItem extends ScheduledItem {
    id: string; // original id
}

export function BulkScheduler({ open, onOpenChange, selectedItems, onSuccess }: BulkSchedulerProps) {
    const [drafts, setDrafts] = useState<DraftItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [regenerating, setRegenerating] = useState<Set<string>>(new Set()); // Track which items are regenerating
    const [regeneratingAll, setRegeneratingAll] = useState(false);
    const [timezone, setTimezone] = useState<string>('local'); // 'local', 'america/eastern', 'america/central', 'america/mountain', 'america/pacific'

    const timezones = [
        { value: 'local', label: 'Local Time (Bangladesh)', offset: 6 },
        { value: 'america/eastern', label: 'USA Eastern (EST/EDT)', offset: -5 }, // -5 in winter, -4 in summer
        { value: 'america/central', label: 'USA Central (CST/CDT)', offset: -6 },
        { value: 'america/mountain', label: 'USA Mountain (MST/MDT)', offset: -7 },
        { value: 'america/pacific', label: 'USA Pacific (PST/PDT)', offset: -8 },
    ];

    // Initialize drafts when selection changes
    useEffect(() => {
        if (open) {
            // Create tomorrow's date at current time in LOCAL timezone
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            setDrafts(selectedItems.map(item => ({
                id: item.id,
                url: item.url,
                thumbnail: item.thumbnail,
                type: item.type,
                caption: `${item.title} \n\nCredit: ${item.author}`,
                date: tomorrow
            })));
        }
    }, [open, selectedItems]);

    const handleDateChange = (id: string, dateStr: string) => {
        // datetime-local gives us a string like "2026-01-05T18:42"
        // We need to parse it as LOCAL time, not UTC
        const localDate = new Date(dateStr);
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, date: localDate } : d));
    };

    const handleCaptionChange = (id: string, caption: string) => {
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, caption } : d));
    };

    // Convert UTC date to target timezone offset
    const getTimezoneOffset = (tz: string): number => {
        const selected = timezones.find(t => t.value === tz);
        return selected ? selected.offset : 6; // Default to local (Bangladesh)
    };

    // Format date for display in selected timezone
    const formatDateForTimezone = (date: Date, tz: string): string => {
        const offset = getTimezoneOffset(tz);
        const localOffset = date.getTimezoneOffset() / 60; // Browser's local offset
        const targetDate = new Date(date.getTime() + (offset - (-localOffset)) * 60 * 60 * 1000);

        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const hours = String(targetDate.getHours()).padStart(2, '0');
        const minutes = String(targetDate.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const spreadDates = () => {
        // Spread starting from tomorrow, 1 post per day at 10 AM
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(10, 0, 0, 0);

        setDrafts(prev => prev.map((d, index) => {
            const date = new Date(start);
            date.setDate(date.getDate() + index);
            return { ...d, date };
        }));

        toast.info("Spread all dates starting from tomorrow at 10:00 AM");
    };

    const regenerateCaption = async (id: string) => {
        const draft = drafts.find(d => d.id === id);
        if (!draft) return;

        setRegenerating(prev => new Set(prev).add(id));

        const result = await regenerateCaptionForInstagram(draft.caption);

        setRegenerating(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        if (result.caption) {
            setDrafts(prev => prev.map(d => d.id === id ? { ...d, caption: result.caption! } : d));
            toast.success("Caption regenerated!");
        } else {
            toast.error(result.error || "Failed to regenerate caption");
        }
    };

    const regenerateAllCaptions = async () => {
        setRegeneratingAll(true);

        const promises = drafts.map(async (draft) => {
            const result = await regenerateCaptionForInstagram(draft.caption);
            return { id: draft.id, caption: result.caption || draft.caption };
        });

        const results = await Promise.all(promises);

        setDrafts(prev => prev.map(d => {
            const updated = results.find(r => r.id === d.id);
            return updated ? { ...d, caption: updated.caption } : d;
        }));

        setRegeneratingAll(false);
        toast.success(`Regenerated ${drafts.length} captions!`);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Normalize for server
        const payload = drafts.map(d => ({
            url: d.url,
            thumbnail: d.thumbnail,
            type: d.type,
            caption: d.caption,
            date: d.date
        }));

        const res = await bulkScheduleAction(payload);
        setIsSubmitting(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`Successfully scheduled ${payload.length} items!`);
            onSuccess();
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-background border-l">
                <SheetHeader className="flex-none pb-4">
                    <SheetTitle>Schedule {selectedItems.length} Items</SheetTitle>
                    <SheetDescription>
                        Customize the date and caption for each post.
                    </SheetDescription>

                    {/* Timezone Selector */}
                    <div className="pt-3">
                        <Label className="text-xs font-medium mb-2 block">Posting Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={spreadDates} className="flex-1">
                            <Wand2 className="w-4 h-4 mr-2" />
                            Spread Daily (10 AM)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={regenerateAllCaptions}
                            disabled={regeneratingAll}
                            className="flex-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-200 hover:from-purple-600 hover:to-purple-600 hover:text-white dark:hover:from-purple-600 dark:hover:to-purple-600"
                        >
                            {regeneratingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Regenerate All Captions
                        </Button>
                    </div>
                </SheetHeader>

                {/* Main scrollable area */}
                <div className="flex-1 overflow-y-auto px-1 -mx-6">
                    <div className="space-y-6 px-6 pb-6">
                        {drafts.map((draft, idx) => (
                            <div key={draft.id} className="flex gap-4 border-b pb-4 last:border-0 border-border">
                                <img src={draft.thumbnail} alt="thumb" className="w-20 h-20 object-cover rounded-md bg-muted border border-border" />
                                <div className="space-y-3 flex-1">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor={`date-${draft.id}`} className="text-xs font-medium">
                                            Schedule Time ({timezones.find(t => t.value === timezone)?.label || 'Local'})
                                        </Label>
                                        <div className="relative">
                                            <CalendarClock className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id={`date-${draft.id}`}
                                                type="datetime-local"
                                                className="pl-8 h-9 text-sm"
                                                value={formatDateForTimezone(draft.date, timezone)}
                                                onChange={(e) => handleDateChange(draft.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`caption-${draft.id}`} className="text-xs font-medium">Caption</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => regenerateCaption(draft.id)}
                                                disabled={regenerating.has(draft.id)}
                                                className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
                                            >
                                                {regenerating.has(draft.id) ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Regenerate
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <Textarea
                                            id={`caption-${draft.id}`}
                                            value={draft.caption}
                                            onChange={(e) => handleCaptionChange(draft.id, e.target.value)}
                                            className="h-20 text-xs resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <SheetFooter className="flex-none pt-4 bg-background border-t border-border mt-auto">
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Confirm Schedule ({drafts.length})
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
