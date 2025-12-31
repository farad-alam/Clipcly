import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Calendar,
  ImageIcon,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
} from "lucide-react"
import { auth } from "@clerk/nextjs/server"

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 instagram-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold instagram-gradient-text">SocialFlow</span>
            </div>
            <div className="flex items-center gap-4">
              {userId ? (
                <Link href="/dashboard">
                  <Button className="instagram-gradient text-white hover:opacity-90 transition-opacity">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signin">
                    <Button variant="ghost" className="text-foreground">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="instagram-gradient text-white hover:opacity-90 transition-opacity">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 md:py-32 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 grid-background opacity-50" />

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 instagram-gradient rounded-full blur-3xl opacity-20 animate-pulse-glow" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full blur-3xl animate-float-slow" />

        {/* Floating Icons */}
        <div className="absolute top-32 right-1/4 animate-float">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute bottom-32 right-1/3 animate-float-slow" style={{ animationDelay: "1s" }}>
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute top-1/2 left-20 animate-float" style={{ animationDelay: "2s" }}>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute bottom-40 right-20 animate-float-slow" style={{ animationDelay: "0.5s" }}>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-block mb-4 px-4 py-1.5 instagram-gradient-soft border border-purple-500/20 rounded-full">
            <span className="text-sm instagram-gradient-text font-medium">Instagram Content Management</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            <span className="instagram-gradient-text">Schedule smarter</span>, grow faster
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
            Plan, create, and schedule your Instagram content with AI-powered tools. Save time and boost engagement with
            our intuitive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {userId ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="instagram-gradient text-white hover:opacity-90 transition-opacity text-lg px-8 shadow-lg shadow-purple-500/30"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="instagram-gradient text-white hover:opacity-90 transition-opacity text-lg px-8 shadow-lg shadow-purple-500/30"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 border-purple-500/30 text-foreground hover:bg-purple-500/10 bg-transparent backdrop-blur-sm"
                  >
                    View Demo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to manage Instagram
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for content creators and social media managers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Visual Calendar</h3>
            <p className="text-muted-foreground leading-relaxed">
              Plan your content with an intuitive drag-and-drop calendar. See your entire content strategy at a glance.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-orange-500/10 border-pink-500/20 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">AI Caption Generator</h3>
            <p className="text-muted-foreground leading-relaxed">
              Generate engaging captions instantly with AI. Save time and maintain consistent brand voice.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Template Library</h3>
            <p className="text-muted-foreground leading-relaxed">
              Access hundreds of professionally designed templates. Customize and post in minutes.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground leading-relaxed">
              Track performance metrics and optimize your content strategy with detailed insights.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-600/20 hover:border-purple-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/20">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Team Collaboration</h3>
            <p className="text-muted-foreground leading-relaxed">
              Work together seamlessly with your team. Assign tasks and manage approvals effortlessly.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-pink-600/10 to-orange-600/10 border-pink-600/20 hover:border-pink-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-600/20">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-orange-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Smart Scheduling</h3>
            <p className="text-muted-foreground leading-relaxed">
              Post at optimal times automatically. Our AI finds the best times for maximum engagement.
            </p>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold instagram-gradient-text mb-2">10K+</div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold instagram-gradient-text mb-2">500K+</div>
            <div className="text-muted-foreground">Posts Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold instagram-gradient-text mb-2">98%</div>
            <div className="text-muted-foreground">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-12 instagram-gradient border-0 shadow-2xl shadow-purple-500/30">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to transform your Instagram strategy?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of creators and businesses using SocialFlow to grow their presence
            </p>
            <Link href={userId ? "/dashboard" : "/signup"}>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90 text-lg px-8 shadow-lg font-semibold"
              >
                {userId ? "Go to Dashboard" : "Get Started Free"}
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 instagram-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold instagram-gradient-text">SocialFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">2024 SocialFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
