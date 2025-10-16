"use client"

import dynamic from "next/dynamic"

// Dynamic import of OpenStreetMap to avoid SSR issues
export const OpenStreetMap = dynamic(
  () => import("./openstreet-map").then((mod) => ({ default: mod.OpenStreetMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading OpenStreetMap...</p>
        </div>
      </div>
    ),
  }
)

// Keep Leaflet export for backward compatibility
export const LeafletMap = dynamic(
  () => import("./leaflet-map-new").then((mod) => ({ default: mod.LeafletMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
)
