"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Instagram, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { disconnectInstagram } from "@/app/actions/instagram"

interface InstagramSettingsProps {
    initialStatus: {
        isConnected: boolean
        username?: string | null
        picture?: string | null
    }
}

export function InstagramSettings({ initialStatus }: InstagramSettingsProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(initialStatus)

    const handleConnect = () => {
        setIsLoading(true)
        // Redirect to the auth endpoint
        window.location.href = "/api/auth/instagram"
    }

    const handleDisconnect = async () => {
        setIsLoading(true)
        const result = await disconnectInstagram()

        if (result.success) {
            setStatus({ isConnected: false, username: null })
            toast({
                title: "Disconnected",
                description: "Instagram account disconnected successfully",
            })
            router.refresh()
        } else {
            toast({
                title: "Error",
                description: "Failed to disconnect account",
                variant: "destructive",
            })
        }
        setIsLoading(false)
    }

    return (
        <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-6">
                <Instagram className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold text-card-foreground">Instagram Connection</h2>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-4">
                        {status.isConnected && status.picture ? (
                            <Avatar className="w-12 h-12 rounded-lg border-2 border-accent">
                                <AvatarImage src={status.picture} alt={status.username || "Instagram Profile"} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-lg">
                                    <Instagram className="w-6 h-6" />
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-lg flex items-center justify-center">
                                <Instagram className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-card-foreground">Instagram Account</p>
                            <div className="flex items-center gap-2 mt-1">
                                {status.isConnected ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-chart-3" />
                                        <span className="text-sm text-muted-foreground">@{status.username || 'connected_user'}</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4 text-destructive" />
                                        <span className="text-sm text-muted-foreground">Not connected</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <Badge
                        variant={status.isConnected ? "default" : "secondary"}
                        className={status.isConnected ? "bg-chart-3 text-white" : "bg-secondary text-secondary-foreground"}
                    >
                        {status.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                </div>

                <Button
                    onClick={status.isConnected ? handleDisconnect : handleConnect}
                    variant={status.isConnected ? "outline" : "default"}
                    disabled={isLoading}
                    className={
                        status.isConnected
                            ? "border-border text-foreground bg-transparent"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {status.isConnected ? "Disconnect Instagram" : "Connect Instagram"}
                </Button>

                {status.isConnected && (
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm text-card-foreground">
                            Your Instagram account is connected and ready to use. You can now schedule and publish posts directly
                            to your Instagram profile.
                        </p>
                    </div>
                )}
            </div>
        </Card>
    )
}
