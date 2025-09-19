"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { BusSearch } from "@/components/passenger/bus-search"
import { RecentSearches } from "@/components/passenger/recent-searches"
import { BusTrackingView } from "@/components/map/bus-tracking-view"
import type { BusSearchResult } from "@/lib/bus-api"
import { Bus, ArrowLeft, Map, List } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function PassengerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBus, setSelectedBus] = useState<BusSearchResult | null>(null)
  const [viewMode, setViewMode] = useState<"search" | "tracking">("search")
  const [trackingView, setTrackingView] = useState<"map" | "timeline">("map")
  const router = useRouter()

  useEffect(() => {
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    setIsLoading(false)

    if (!authenticated) {
      router.push("/auth")
    }
  }, [router])

  const handleBusSelect = (bus: BusSearchResult) => {
    setSelectedBus(bus)
    setViewMode("tracking")
    setTrackingView("map") // Default to map view

    // Add to recent searches if available
    if (bus.journeyDetails && (window as any).addRecentSearch) {
      ;(window as any).addRecentSearch(bus.journeyDetails.fromStop.name, bus.journeyDetails.toStop.name)
    }
  }

  const handleBackToSearch = () => {
    setSelectedBus(null)
    setViewMode("search")
  }

  const handleRecentSearchSelect = (fromStop: string, toStop: string) => {
    // This would trigger a new search with the selected stops
    console.log("Selected recent search:", fromStop, "to", toStop)
  }

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/auth")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center safe-area-inset">
        <div className="text-center animate-fade-in">
          <Bus className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse-subtle" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 pwa-safe-area animate-slide-down">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            {viewMode === "tracking" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSearch}
                className="text-primary-foreground hover:bg-primary-foreground/20 p-1 touch-friendly animate-scale-in"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Bus className="h-6 w-6" />
            <h1 className="text-lg sm:text-xl font-bold text-balance">
              {viewMode === "search" ? "Find Bus" : `Tracking ${selectedBus?.busNumber}`}
            </h1>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout} className="touch-friendly hover-lift">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 max-w-md mx-auto pb-20 animate-fade-in">
        {viewMode === "search" ? (
          <div className="space-y-4 animate-slide-up">
            <BusSearch onBusSelect={handleBusSelect} />
            <RecentSearches onSearchSelect={handleRecentSearchSelect} />
          </div>
        ) : selectedBus ? (
          <div className="animate-slide-up">
            <BusTrackingView selectedBus={selectedBus} onViewChange={setTrackingView} currentView={trackingView} />
          </div>
        ) : null}
      </main>

      {/* Bottom Navigation (when tracking) */}
      {viewMode === "tracking" && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-3 sm:p-4 animate-slide-up">
          <div className="flex justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Button
              variant={trackingView === "map" ? "default" : "outline"}
              className="flex-1 touch-friendly hover-lift"
              onClick={() => setTrackingView("map")}
            >
              <Map className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Map View</span>
              <span className="xs:hidden">Map</span>
            </Button>
            <Button
              variant={trackingView === "timeline" ? "default" : "outline"}
              className="flex-1 touch-friendly hover-lift"
              onClick={() => setTrackingView("timeline")}
            >
              <List className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Timeline</span>
              <span className="xs:hidden">List</span>
            </Button>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
}
