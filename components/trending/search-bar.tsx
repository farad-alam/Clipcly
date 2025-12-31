"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp } from "lucide-react"

interface SearchBarProps {
    onSearch: (keyword: string) => void
    onLoadTrending: () => void
    loading?: boolean
}

export default function SearchBar({ onSearch, onLoadTrending, loading }: SearchBarProps) {
    const [keyword, setKeyword] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (keyword.trim()) {
            onSearch(keyword)
        }
    }

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                <Input
                    type="text"
                    placeholder="Search TikTok videos by keyword..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                />
                <Button type="submit" disabled={loading || !keyword.trim()} className="instagram-gradient text-white">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                </Button>
            </form>
            <Button
                variant="outline"
                onClick={onLoadTrending}
                disabled={loading}
                className="border-primary text-primary hover:bg-primary/10"
            >
                <TrendingUp className="w-4 h-4 mr-2" />
                Load Trending
            </Button>
        </div>
    )
}
