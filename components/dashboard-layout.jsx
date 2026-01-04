"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SignOutButton, useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, PlusCircle, ImageIcon, Settings, Menu, X, Sparkles, Moon, Sun, LogOut, Instagram, Grid3X3, TrendingUp, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Create Post", href: "/create", icon: PlusCircle },
  { name: "Find Content", href: "/discovery", icon: Search },
  { name: "All Posts", href: "/all-posts", icon: Grid3X3 },
  { name: "Templates", href: "/templates", icon: ImageIcon },
  { name: "TikTok Trends", href: "/trending", icon: TrendingUp },
  { name: "Pinterest Trends", href: "/trending/pinterest", icon: Sparkles },
  { name: "Connect Instagram", href: "/connect-instagram", icon: Instagram },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }) {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">SocialFlow</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {user?.firstName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {isLoaded ? user?.fullName || "User" : "Loading..."}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {isLoaded ? user?.primaryEmailAddress?.emailAddress : "..."}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleDarkMode}>
                  {darkMode ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton redirectUrl="/">
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="hidden lg:flex text-foreground">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Link href="/create">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
