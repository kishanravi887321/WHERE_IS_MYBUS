"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, Circle, Navigation, MapPin, Zap, Users, WifiOff } from "lucide-react"
import type { BusSearchResult, BusStop } from "@/lib/bus-api"

interface BusTimelineProps {
  selectedBus: BusSearchResult
  busLocation?: {
    latitude: number
    longitude: number
    speed: number
    heading: number
    lastUpdated: string
  } | null
}

interface StopStatus {
  stop: BusStop
  status: "completed" | "current" | "upcoming"
  eta?: string
  actualTime?: string
  isUserStop?: boolean
}

export function BusTimeline({ selectedBus, busLocation }: BusTimelineProps) {
  const [stopStatuses, setStopStatuses] = useState<StopStatus[]>([])
  const [currentStopIndex, setCurrentStopIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculate stop statuses and ETAs based on real bus location
  useEffect(() => {
    if (!selectedBus.journeyDetails) return

    const allStops = [
      selectedBus.journeyDetails.fromStop,
      ...selectedBus.journeyDetails.stopsInBetween,
      selectedBus.journeyDetails.toStop,
    ]

    let progressIndex = currentStopIndex

    if (busLocation) {
      // Find closest stop to current bus location
      let minDistance = Number.POSITIVE_INFINITY
      let closestStopIndex = 0

      allStops.forEach((stop, index) => {
        const distance = Math.sqrt(
          Math.pow(stop.latitude - busLocation.latitude, 2) + Math.pow(stop.longitude - busLocation.longitude, 2),
        )
        if (distance < minDistance) {
          minDistance = distance
          closestStopIndex = index
        }
      })

      progressIndex = closestStopIndex
    }

    const statuses: StopStatus[] = allStops.map((stop, index) => {
      let status: "completed" | "current" | "upcoming"
      let eta: string | undefined
      let actualTime: string | undefined

      if (index < progressIndex) {
        status = "completed"
        const minutesAgo = (progressIndex - index) * 3 + Math.floor(Math.random() * 5)
        actualTime = new Date(Date.now() - minutesAgo * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      } else if (index === progressIndex) {
        status = "current"
        eta = busLocation ? "Arriving" : "Estimated arrival"
      } else {
        status = "upcoming"
        const stopsAway = index - progressIndex
        const avgTimePerStop = 4
        const etaMinutes = stopsAway * avgTimePerStop + Math.floor(Math.random() * 3)
        eta = `${etaMinutes} min`
      }

      const isUserStop =
        stop.name === selectedBus.journeyDetails?.fromStop.name || stop.name === selectedBus.journeyDetails?.toStop.name

      return {
        stop,
        status,
        eta,
        actualTime,
        isUserStop,
      }
    })

    setStopStatuses(statuses)
    setCurrentStopIndex(progressIndex)
  }, [selectedBus, busLocation, currentStopIndex])

  // Update progress when bus location changes
  useEffect(() => {
    if (!busLocation || !selectedBus.isDriverOnline) return

    // Simulate gradual progress for demo (in real app, this would be based on actual location)
    const interval = setInterval(() => {
      setCurrentStopIndex((prev) => {
        const maxIndex = selectedBus.journeyDetails?.totalStopsInJourney || 1
        return prev < maxIndex - 1 ? prev + 1 : prev
      })
    }, 15000) // Move to next stop every 15 seconds for demo

    return () => clearInterval(interval)
  }, [busLocation, selectedBus])

  const getStopIcon = (status: "completed" | "current" | "upcoming", isUserStop: boolean) => {
    if (status === "completed") {
      return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
    } else if (status === "current") {
      return <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 animate-pulse" />
    } else {
      return <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
    }
  }

  const getStopColor = (status: "completed" | "current" | "upcoming") => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "current":
        return "text-blue-600"
      case "upcoming":
        return "text-muted-foreground"
    }
  }

  const getConnectorColor = (status: "completed" | "current" | "upcoming") => {
    switch (status) {
      case "completed":
        return "border-green-600"
      case "current":
        return "border-blue-600"
      case "upcoming":
        return "border-muted-foreground/30"
    }
  }

  if (!selectedBus.journeyDetails) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 animate-scale-in">
        <div className="text-center py-8 sm:py-12">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full blur-lg opacity-50 animate-glow"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Route Information</h3>
          <p className="text-sm sm:text-base text-blue-200">Route details are not available for this bus</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 animate-slide-down">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-600 rounded-xl blur-lg opacity-50 animate-glow"></div>
              <div className="relative p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Live Timeline</h2>
              <p className="text-xs sm:text-sm text-blue-200 truncate max-w-[200px] sm:max-w-none">
                {selectedBus.routeName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant={selectedBus.isDriverOnline && busLocation ? "default" : "secondary"}
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1"
            >
              {selectedBus.isDriverOnline && busLocation ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </div>
              )}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-effect rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              {busLocation ? `${busLocation.speed.toFixed(0)}` : "0"}
            </div>
            <div className="text-xs text-blue-200">km/h</div>
          </div>
          <div className="glass-effect rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">{selectedBus.connectedPassengers}</div>
            <div className="text-xs text-blue-200">passengers</div>
          </div>
          <div className="glass-effect rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              {stopStatuses.filter((s) => s.status === "completed").length}
            </div>
            <div className="text-xs text-blue-200">completed</div>
          </div>
          <div className="glass-effect rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              {stopStatuses.filter((s) => s.status === "upcoming").length}
            </div>
            <div className="text-xs text-blue-200">remaining</div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 animate-scale-in">
        <div className="space-y-0">
          {stopStatuses.map((stopStatus, index) => (
            <div key={`${stopStatus.stop.name}-${index}`} className="relative">
              <div className="flex items-start gap-3 sm:gap-4 pb-4 sm:pb-6 touch-manipulation">
                <div className="flex-shrink-0 mt-1 sm:mt-2">
                  <div className="relative">
                    {stopStatus.status === "current" && (
                      <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
                    )}
                    <div
                      className={`relative p-1 sm:p-2 rounded-full ${
                        stopStatus.status === "current" ? "bg-blue-500/20" : ""
                      }`}
                    >
                      {getStopIcon(stopStatus.status, stopStatus.isUserStop || false)}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium text-sm sm:text-base ${getStopColor(stopStatus.status)} ${
                          stopStatus.isUserStop ? "font-bold" : ""
                        } truncate`}
                      >
                        {stopStatus.stop.name}
                      </h3>
                      {stopStatus.isUserStop && (
                        <Badge variant="outline" className="mt-1 text-xs px-2 py-0.5 border-white/30 text-white/80">
                          {stopStatus.stop.name === selectedBus.journeyDetails?.fromStop.name
                            ? "Your Start"
                            : "Your Destination"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-right flex-shrink-0">
                      <div className={`font-medium ${getStopColor(stopStatus.status)}`}>
                        {stopStatus.actualTime || stopStatus.eta}
                      </div>
                      {stopStatus.status === "current" && busLocation && (
                        <div className="text-xs text-blue-300 mt-1">{busLocation.speed.toFixed(0)} km/h</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div
                      className={`px-2 py-1 rounded-full glass-effect ${getStopColor(stopStatus.status)} font-medium`}
                    >
                      {stopStatus.status === "completed" && "✓ Departed"}
                      {stopStatus.status === "current" && "🚌 Arriving Now"}
                      {stopStatus.status === "upcoming" && `⏱️ ETA: ${stopStatus.eta}`}
                    </div>
                    {stopStatus.status === "current" && (
                      <div className="flex items-center space-x-1 text-blue-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs">Live</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {index < stopStatuses.length - 1 && (
                <div
                  className={`absolute left-2 sm:left-3 top-8 sm:top-10 w-0.5 h-6 sm:h-8 border-l-2 border-dashed ${getConnectorColor(stopStatus.status)}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 animate-slide-up">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between text-sm sm:text-base mb-3">
            <span className="text-blue-200 font-medium">Journey Progress</span>
            <span className="text-white font-bold text-lg sm:text-xl">
              {Math.round((stopStatuses.filter((s) => s.status === "completed").length / stopStatuses.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 sm:h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{
                width: `${(stopStatuses.filter((s) => s.status === "completed").length / stopStatuses.length) * 100}%`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-400">
              {stopStatuses.filter((s) => s.status === "completed").length}
            </div>
            <div className="text-xs sm:text-sm text-blue-200">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-400">
              {stopStatuses.filter((s) => s.status === "current").length}
            </div>
            <div className="text-xs sm:text-sm text-blue-200">Current</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-400">
              {stopStatuses.filter((s) => s.status === "upcoming").length}
            </div>
            <div className="text-xs sm:text-sm text-blue-200">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-amber-400">
              {selectedBus.journeyDetails?.estimatedJourneyTime || "N/A"}
            </div>
            <div className="text-xs sm:text-sm text-blue-200">Total Time</div>
          </div>
        </div>
      </div>

      {selectedBus.isDriverOnline && busLocation && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
              <div className="relative w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-sm sm:text-base font-medium text-white">Live Updates Active</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-blue-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>Updated: {new Date(busLocation.lastUpdated).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Speed: {busLocation.speed.toFixed(1)} km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-400" />
              <span>Passengers: {selectedBus.connectedPassengers}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
