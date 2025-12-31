import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata = {
  metadataBase: new URL("https://social-flowai.vercel.app"),
  title: {
    default: "SocialFlow - AI Social Media Content Management",
    template: "%s | SocialFlow",
  },
  description:
    "SocialFlow is an AI-powered platform that helps you create, schedule, and manage social media content effortlessly. Generate posts, analyze engagement, and grow your brand with AI automation.",
  keywords: [
    "AI social media manager",
    "AI content creator",
    "social media automation",
    "social media scheduler",
    "AI copywriter",
    "content planner",
    "Instagram scheduler",
    "Facebook post generator",
    "LinkedIn AI content",
    "SocialFlow",
  ],
  authors: [
    { name: "SocialFlow Team", url: "https://social-flowai.vercel.app" },
  ],
  creator: "SocialFlow AI",
  publisher: "SocialFlow",
  openGraph: {
    title: "SocialFlow - AI Social Media Content Management",
    description:
      "Create, schedule, and manage all your social media content with AI. SocialFlow helps automate your social growth with smart scheduling and post generation.",
    url: "https://social-flowai.vercel.app",
    siteName: "SocialFlow",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://social-flowai.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "SocialFlow - AI Social Media Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialFlow - AI Social Media Content Management",
    description:
      "AI-powered social media content creation and scheduling platform. Save time and grow faster with SocialFlow.",
    site: "@socialflowai",
    creator: "@socialflowai",
    images: ["https://social-flowai.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  alternates: {
    canonical: "https://social-flowai.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};


import { ClerkProvider } from '@clerk/nextjs'

import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "SocialFlow",
                url: "https://social-flowai.vercel.app",
                applicationCategory: "Social Media Management",
                operatingSystem: "Web",
                description:
                  "AI-powered platform for managing, scheduling, and generating social media content.",
                image: "https://social-flowai.vercel.app/og-image.png",
                author: {
                  "@type": "Organization",
                  name: "SocialFlow AI",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.9",
                  reviewCount: "128",
                },
              }),
            }}
          />

          {/* <link rel="canonical" href="https://bismillah-auto.netlify.app" /> */}
          <link rel="icon" type="image/svg+xml" href="/favicon.png" />
        </head>
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
          {children}
          <Analytics />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
