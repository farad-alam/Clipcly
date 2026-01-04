import { PinterestGrid } from "@/components/trending/pinterest-grid";
import { DashboardLayout } from "@/components/dashboard-layout";
import { pinterestService } from "@/lib/pinterest/service";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PinterestTrendingPage() {
    // Server-side fetch for initial data
    const pins = await pinterestService.getTrendingPins();

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/trending">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to TikTok
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Pinterest Trending</h1>
                        <p className="text-muted-foreground">Discover and schedule popular pins</p>
                    </div>
                </div>

                <PinterestGrid initialPins={pins} />
            </div>
        </DashboardLayout>
    )
}
