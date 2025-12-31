
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Palette, Bell, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsClient({ instagramStatus }) {
    const { toast } = useToast()
    const [darkMode, setDarkMode] = useState(true)
    const [notifications, setNotifications] = useState({
        postScheduled: true,
        postPublished: true,
        engagement: false,
        weeklyReport: true,
    })

    const [profile, setProfile] = useState({
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
        bio: "Content creator & social media manager",
    })

    const handleSaveProfile = () => {
        toast({
            title: "Profile Updated",
            description: "Your profile information has been saved successfully.",
        })
    }

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        document.documentElement.classList.toggle("dark")
        toast({
            title: "Theme Changed",
            description: `Switched to ${!darkMode ? "dark" : "light"} mode.`,
        })
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences</p>
                </div>

                {/* Profile Settings */}
                <Card className="p-6 bg-card border-border">
                    <div className="flex items-center gap-2 mb-6">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold text-card-foreground">Profile Information</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src="/placeholder.svg?height=80&width=80" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">JD</AvatarFallback>
                            </Avatar>
                            <div>
                                <Button variant="outline" className="border-border text-foreground bg-transparent">
                                    Change Photo
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF (MAX. 2MB)</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-card-foreground">
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="bg-background border-input text-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-card-foreground">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    value={profile.username}
                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-card-foreground">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="bg-background border-input text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio" className="text-card-foreground">
                                Bio
                            </Label>
                            <Input
                                id="bio"
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                className="bg-background border-input text-foreground"
                            />
                        </div>

                        <Button onClick={handleSaveProfile} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Save Changes
                        </Button>
                    </div>
                </Card>

                {/* Appearance */}
                <Card className="p-6 bg-card border-border">
                    <div className="flex items-center gap-2 mb-6">
                        <Palette className="w-5 h-5 text-chart-4" />
                        <h2 className="text-xl font-semibold text-card-foreground">Appearance</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-card-foreground">Dark Mode</p>
                                <p className="text-sm text-muted-foreground">Use dark theme across the application</p>
                            </div>
                            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                        </div>

                        <Separator className="bg-border" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-card-foreground">Compact View</p>
                                <p className="text-sm text-muted-foreground">Show more content in less space</p>
                            </div>
                            <Switch />
                        </div>
                    </div>
                </Card>

                {/* Notifications */}
                <Card className="p-6 bg-card border-border">
                    <div className="flex items-center gap-2 mb-6">
                        <Bell className="w-5 h-5 text-chart-5" />
                        <h2 className="text-xl font-semibold text-card-foreground">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-card-foreground">Post Scheduled</p>
                                <p className="text-sm text-muted-foreground">Get notified when a post is scheduled</p>
                            </div>
                            <Switch
                                checked={notifications.postScheduled}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, postScheduled: checked })}
                            />
                        </div>

                        <Separator className="bg-border" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-card-foreground">Post Published</p>
                                <p className="text-sm text-muted-foreground">Get notified when a post goes live</p>
                            </div>
                            <Switch
                                checked={notifications.postPublished}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, postPublished: checked })}
                            />
                        </div>

                        <Separator className="bg-border" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-card-foreground">Engagement Alerts</p>
                                <p className="text-sm text-muted-foreground">Get notified about likes and comments</p>
                            </div>
                            <Switch
                                checked={notifications.engagement}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, engagement: checked })}
                            />
                        </div>

                        <Separator className="bg-border" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-card-foreground">Weekly Report</p>
                                <p className="text-sm text-muted-foreground">Receive weekly performance summary</p>
                            </div>
                            <Switch
                                checked={notifications.weeklyReport}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                            />
                        </div>
                    </div>
                </Card>

                {/* Security */}
                <Card className="p-6 bg-card border-border">
                    <div className="flex items-center gap-2 mb-6">
                        <Lock className="w-5 h-5 text-destructive" />
                        <h2 className="text-xl font-semibold text-card-foreground">Security</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="current-password" className="text-card-foreground">
                                Current Password
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                placeholder="••••••••"
                                className="mt-2 bg-background border-input text-foreground"
                            />
                        </div>

                        <div>
                            <Label htmlFor="new-password" className="text-card-foreground">
                                New Password
                            </Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="••••••••"
                                className="mt-2 bg-background border-input text-foreground"
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirm-password" className="text-card-foreground">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                className="mt-2 bg-background border-input text-foreground"
                            />
                        </div>

                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Update Password</Button>
                    </div>
                </Card>

                {/* Danger Zone */}
                <Card className="p-6 bg-card border-destructive">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>

                    <Button variant="destructive">Delete Account</Button>
                </Card>
            </div>
        </DashboardLayout>
    )
}
