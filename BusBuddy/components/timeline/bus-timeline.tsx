"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, Circle, Navigation } from "lucide-react"
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
        // Generate realistic past times
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
        // Calculate ETA based on average speed and distance
        const stopsAway = index - progressIndex
        const avgTimePerStop = 4 // minutes
        const etaMinutes = stopsAway * avgTimePerStop + Math.floor(Math.random() * 3)
        eta = `${etaMinutes} min`
      }

      // Mark user's boarding and destination stops
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
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (status === "current") {
      return <Navigation className="h-5 w-5 text-blue-600 animate-pulse" />
    } else {
      return <Circle className="h-5 w-5 text-muted-foreground" />
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
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No route information available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Bus Timeline
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{selectedBus.routeName}</p>
            <Badge variant={selectedBus.isDriverOnline && busLocation ? "default" : "secondary"}>
              {selectedBus.isDriverOnline && busLocation ? "Live" : "Offline"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-0">
            {stopStatuses.map((stopStatus, index) => (
              <div key={`${stopStatus.stop.name}-${index}`} className="relative">
                {/* Stop Item */}
                <div className="flex items-start gap-3 pb-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStopIcon(stopStatus.status, stopStatus.isUserStop || false)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`font-medium text-sm ${getStopColor(stopStatus.status)} ${
                          stopStatus.isUserStop ? "font-bold" : ""
                        }`}
                      >
                        {stopStatus.stop.name}
                        {stopStatus.isUserStop && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {stopStatus.stop.name === selectedBus.journeyDetails?.fromStop.name ? "Start" : "End"}
                          </Badge>
                        )}
                      </h3>
                      <div className="text-xs text-muted-foreground">{stopStatus.actualTime || stopStatus.eta}</div>
                    </div>

                    {/* Status Info */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`${getStopColor(stopStatus.status)}`}>
                        {stopStatus.status === "completed" && "Departed"}
                        {stopStatus.status === "current" && "Arriving Now"}
                        {stopStatus.status === "upcoming" && `ETA: ${stopStatus.eta}`}
                      </span>
                      {stopStatus.status === "current" && busLocation && (
                        <span className="text-muted-foreground">• {busLocation.speed.toFixed(0)} km/h</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < stopStatuses.length - 1 && (
                  <div
                    className={`absolute left-2.5 top-8 w-0.5 h-4 border-l-2 border-dashed ${getConnectorColor(
                      stopStatus.status,
                    )}`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stopStatuses.filter((s) => s.status === "completed").length}
              </div>
              <div className="text-xs text-muted-foreground">Stops Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stopStatuses.filter((s) => s.status === "upcoming").length}
              </div>
              <div className="text-xs text-muted-foreground">Stops Remaining</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Journey Progress</span>
              <span className="font-medium">
                {Math.round((stopStatuses.filter((s) => s.status === "completed").length / stopStatuses.length) * 100)}%
              </span>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    (stopStatuses.filter((s) => s.status === "completed").length / stopStatuses.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Updates Info */}
      {selectedBus.isDriverOnline && busLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live Updates</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Last updated: {new Date(busLocation.lastUpdated).toLocaleTimeString()}</p>
              <p>Current speed: {busLocation.speed.toFixed(1)} km/h</p>
              <p>Connected passengers: {selectedBus.connectedPassengers}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
