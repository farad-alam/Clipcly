'use client'

import { useState, useEffect } from "react"
import { PinterestPin } from "@/lib/pinterest/types"
import { PinterestCard } from "./pinterest-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { searchPinsAction } from "@/app/actions/pinterest"
import { MultiSelectToolbar } from "./multi-select-toolbar"
import { useToast } from "@/hooks/use-toast"

interface PinterestGridProps {
    initialPins: PinterestPin[]
}

export function PinterestGrid({ initialPins }: PinterestGridProps) {
    const { toast } = useToast()
    const [pins, setPins] = useState<PinterestPin[]>(initialPins)
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)

    // Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedPins, setSelectedPins] = useState<PinterestPin[]>([])

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        const res = await searchPinsAction(query)
        if (res.data) {
            setPins(res.data)
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to search",
                variant: "destructive"
            })
        }
        setLoading(false)
    }

    const toggleSelection = (pin: PinterestPin) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true)
            setSelectedPins([pin])
            return
        }

        if (selectedPins.find(p => p.id === pin.id)) {
            setSelectedPins(prev => prev.filter(p => p.id !== pin.id))
        } else {
            setSelectedPins(prev => [...prev, pin])
        }
    }

    const cancelSelection = () => {
        setIsSelectionMode(false)
        setSelectedPins([])
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Search Pinterest trends..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="max-w-md"
                />
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </form>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {pins.map((pin) => (
                    <PinterestCard
                        key={pin.id}
                        pin={pin}
                        selectionMode={true} // Always allow entering selection mode by clicking overlay
                        selected={!!selectedPins.find(p => p.id === pin.id)}
                        onSelect={toggleSelection}
                    />
                ))}
            </div>

            {pins.length === 0 && !loading && (
                <div className="text-center py-20 text-muted-foreground">
                    No pins found. Try searching for something else.
                </div>
            )}

            {/* Floating Toolbar */}
            {isSelectionMode && (
                <MultiSelectToolbar
                    selectedCount={selectedPins.length}
                    onCancel={cancelSelection}
                    selectedItems={selectedPins}
                />
            )}
        </div>
    )
}
