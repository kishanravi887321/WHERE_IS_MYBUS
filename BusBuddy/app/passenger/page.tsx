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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center safe-area-inset">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mx-auto"></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-blue-200 opacity-20 mx-auto"></div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-white/80">
            <Bus className="h-6 w-6 animate-pulse" />
            <p className="text-lg font-medium">Loading Bus Search...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 safe-area-inset">
      {/* Professional Header with Glass Effect */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-xl"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative p-6 sticky top-0 z-10 border-b border-white/10">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              {viewMode === "tracking" && (
                <button
                  onClick={handleBackToSearch}
                  className="group flex items-center space-x-2 text-white/80 hover:text-white transition-all duration-300 transform hover:scale-105"
                >
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                    <ArrowLeft className="h-5 w-5" />
                  </div>
                </button>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-xl">
                  <Bus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {viewMode === "search" ? "Find Your Bus" : `Tracking ${selectedBus?.busNumber}`}
                  </h1>
                  <p className="text-sm text-blue-200">
                    {viewMode === "search" ? "Smart Transit Search System" : "Real-time Bus Tracking"}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-medium"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Glass Cards */}
      <main className="p-6 max-w-7xl mx-auto pb-20">
        {viewMode === "search" ? (
          <div className="space-y-6">
            {/* Search Section */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Bus Search</h2>
              </div>
              <BusSearch onBusSelect={handleBusSelect} />
            </div>

            {/* Recent Searches Section */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Recent Searches</h2>
              </div>
              <RecentSearches onSearchSelect={handleRecentSearchSelect} />
            </div>
          </div>
        ) : selectedBus ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Live Tracking</h2>
            </div>
            <BusTrackingView selectedBus={selectedBus} onViewChange={setTrackingView} currentView={trackingView} />
          </div>
        ) : null}
      </main>

      {/* Professional Bottom Navigation (when tracking) */}
      {viewMode === "tracking" && (
        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-slate-900/80 border-t border-white/20 p-6 shadow-2xl">
          <div className="flex justify-center gap-4 max-w-md mx-auto">
            <Button
              onClick={() => setTrackingView("map")}
              className={`flex-1 py-4 px-6 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                trackingView === "map" 
                  ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg hover:from-blue-600 hover:to-cyan-700" 
                  : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20"
              }`}
            >
              <Map className="h-5 w-5 mr-3" />
              <span>Map View</span>
            </Button>
            <Button
              onClick={() => setTrackingView("timeline")}
              className={`flex-1 py-4 px-6 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                trackingView === "timeline" 
                  ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg hover:from-purple-600 hover:to-violet-700" 
                  : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20"
              }`}
            >
              <List className="h-5 w-5 mr-3" />
              <span>Timeline</span>
            </Button>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
}
