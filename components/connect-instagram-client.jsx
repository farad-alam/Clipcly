"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { InstagramSettings } from "@/components/instagram-settings"

export default function ConnectInstagramClient({ instagramStatus }) {
    return (
        <DashboardLayout>
            <div className="max-w-4xl space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Connect Instagram</h1>
                    <p className="text-muted-foreground">Manage your Instagram account connection and settings</p>
                </div>

                {/* Instagram Connection */}
                <InstagramSettings initialStatus={instagramStatus} />
            </div>
        </DashboardLayout>
    )
}
