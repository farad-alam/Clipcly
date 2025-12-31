"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Search, Sparkles, TrendingUp, Heart, ShoppingBag, Camera, Coffee, Plane } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const templates = [
  {
    id: 1,
    title: "Fashion Collection",
    category: "Fashion",
    image: "/fashion-outfit-minimal.jpg",
    icon: ShoppingBag,
    color: "primary",
    description: "Perfect for showcasing your latest fashion collection",
  },
  {
    id: 2,
    title: "Food Photography",
    category: "Food",
    image: "/food-photography-aesthetic.jpg",
    icon: Coffee,
    color: "accent",
    description: "Delicious food photography template",
  },
  {
    id: 3,
    title: "Travel Adventure",
    category: "Travel",
    image: "/serene-mountain-lake.png",
    icon: Plane,
    color: "chart-3",
    description: "Share your travel experiences beautifully",
  },
  {
    id: 4,
    title: "Product Showcase",
    category: "Business",
    image: "/product-showcase-minimal.jpg",
    icon: Camera,
    color: "chart-4",
    description: "Highlight your products professionally",
  },
  {
    id: 5,
    title: "Motivational Quote",
    category: "Lifestyle",
    image: "/motivational-quote-design.jpg",
    icon: Sparkles,
    color: "primary",
    description: "Inspire your audience with beautiful quotes",
  },
  {
    id: 6,
    title: "Fitness Journey",
    category: "Fitness",
    image: "/fitness-workout-motivation.png",
    icon: TrendingUp,
    color: "chart-5",
    description: "Document your fitness transformation",
  },
  {
    id: 7,
    title: "Beauty Tutorial",
    category: "Beauty",
    image: "/beauty-makeup-tutorial.jpg",
    icon: Heart,
    color: "accent",
    description: "Create stunning beauty content",
  },
  {
    id: 8,
    title: "Minimalist Design",
    category: "Design",
    image: "/minimalist-design-aesthetic.jpg",
    icon: Camera,
    color: "chart-3",
    description: "Clean and modern minimalist template",
  },
  {
    id: 9,
    title: "Event Announcement",
    category: "Events",
    image: "/event-announcement-poster.jpg",
    icon: Sparkles,
    color: "primary",
    description: "Announce your events in style",
  },
]

const categories = [
  "All",
  "Fashion",
  "Food",
  "Travel",
  "Business",
  "Lifestyle",
  "Fitness",
  "Beauty",
  "Design",
  "Events",
]

export default function TemplatesPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleApplyTemplate = () => {
    toast({
      title: "Template Applied!",
      description: `${selectedTemplate?.title} has been added to your create post page.`,
    })
    setShowPreview(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Template Library</h1>
          <p className="text-muted-foreground">Browse and use professionally designed templates for your posts</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border text-foreground"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-primary/50 bg-transparent"
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border">
            <p className="text-2xl font-bold text-card-foreground">{templates.length}</p>
            <p className="text-sm text-muted-foreground">Total Templates</p>
          </Card>
          <Card className="p-4 bg-card border-border">
            <p className="text-2xl font-bold text-card-foreground">{categories.length - 1}</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </Card>
          <Card className="p-4 bg-card border-border">
            <p className="text-2xl font-bold text-card-foreground">50+</p>
            <p className="text-sm text-muted-foreground">New This Month</p>
          </Card>
          <Card className="p-4 bg-card border-border">
            <p className="text-2xl font-bold text-card-foreground">1.2K</p>
            <p className="text-sm text-muted-foreground">Times Used</p>
          </Card>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const Icon = template.icon
            return (
              <Card
                key={template.id}
                className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={template.image || "/placeholder.svg"}
                    alt={template.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-1">{template.title}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <div
                      className={`w-10 h-10 bg-${template.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 text-${template.color}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      {template.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="text-primary hover:text-primary/80"
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <Card className="p-12 bg-card border-border">
            <div className="text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">No templates found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          </Card>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{selectedTemplate?.title}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <img
              src={selectedTemplate?.image || "/placeholder.svg"}
              alt={selectedTemplate?.title}
              className="w-full aspect-square object-cover rounded-lg"
            />

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {selectedTemplate?.category}
              </Badge>
              <Badge variant="outline" className="border-border text-foreground">
                Professional
              </Badge>
              <Badge variant="outline" className="border-border text-foreground">
                High Quality
              </Badge>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-secondary-foreground">
                This template includes pre-designed layouts, color schemes, and typography that you can customize to
                match your brand.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="border-border text-foreground bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
