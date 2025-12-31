"use client"

import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col items-center gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">SocialFlow</span>
                </Link>
                <SignIn
                    path="/signin"
                    routing="path"
                    fallbackRedirectUrl="/dashboard"
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "bg-card border-border shadow-none w-full",
                            headerTitle: "text-card-foreground",
                            headerSubtitle: "text-muted-foreground",
                            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                            formFieldLabel: "text-card-foreground",
                            formFieldInput: "bg-background border-input text-foreground",
                            footerActionLink: "text-primary hover:text-primary/80"
                        }
                    }} />
            </div>
        </div>
    )
}
