import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "BusBuddy - Real-time Bus Tracking",
  description: "Track buses in real-time with BusBuddy PWA",
  generator: "BusBuddy",
  manifest: "/manifest.json",
  keywords: ["bus", "tracking", "real-time", "transport", "PWA"],
  authors: [{ name: "BusBuddy Team" }],
  icons: {
    icon: "/icon-192x192.jpg",
    shortcut: "/icon-192x192.jpg",
    apple: "/icon-192x192.jpg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#374151",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
