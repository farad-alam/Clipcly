import { DiscoveryContainer } from "@/components/discovery/DiscoveryContainer";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function DiscoveryPage() {
    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent mb-2">
                    Content Discovery Engine
                </h1>
                <p className="text-muted-foreground mb-8">
                    Find trending photos and videos from Unsplash, Pexels, and Reddit to schedule instantly.
                </p>

                <DiscoveryContainer />
            </div>
        </DashboardLayout>
    );
}
