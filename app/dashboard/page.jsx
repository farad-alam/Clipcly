"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, TrendingUp, Clock, CheckCircle2, FileEdit, Grid3X3 } from "lucide-react"
import { getDashboardData } from "@/app/actions/dashboard"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [stats, setStats] = useState({
    totalPosts: 0,
    published: 0,
    scheduled: 0,
    drafts: 0
  })

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDashboardData()
        if (data.posts) {
          setPosts(data.posts)
        }
        if (data.stats) {
          setStats(data.stats)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [refreshTrigger])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your Instagram content and track performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Posts</p>
              <Grid3X3 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-4xl font-bold text-card-foreground">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Lifetime content count</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Published</p>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-card-foreground">{stats.published}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Successfully posted</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Scheduled</p>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-card-foreground">{stats.scheduled}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Ready for future</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-orange-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Drafts</p>
              <FileEdit className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-card-foreground">{stats.drafts}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Awaiting completion</p>
          </Card>
        </div>

        {/* Calendar Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-card-foreground">Content Calendar</h2>
            <Link href="/all-posts">
              <Button variant="outline" className="border-border text-foreground bg-transparent">
                View All Posts
              </Button>
            </Link>
          </div>
          <CalendarView posts={posts} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
        </div>
      </div>
    </DashboardLayout>
  )
}
