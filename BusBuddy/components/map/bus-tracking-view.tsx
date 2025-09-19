"use client"

import { useState } from "react"
import { LeafletMap } from "./index"
import { BusTimeline } from "../timeline/bus-timeline"
import { useBusTracking } from "@/hooks/use-socket"
import type { BusSearchResult } from "@/lib/bus-api"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, Wifi, WifiOff, Zap } from "lucide-react"

interface BusTrackingViewProps {
  selectedBus: BusSearchResult
  onViewChange: (view: "map" | "timeline") => void
  currentView: "map" | "timeline"
}

export function BusTrackingView({ selectedBus, onViewChange, currentView }: BusTrackingViewProps) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const { busLocation, driverStatus, lastUpdate, isConnected } = useBusTracking(selectedBus.busId)

  // Convert socket data to component format
  const busLocationData = busLocation
    ? {
        latitude: busLocation.location.latitude,
        longitude: busLocation.location.longitude,
        speed: busLocation.speed,
        heading: busLocation.heading,
        lastUpdated: busLocation.timestamp,
      }
    : null

  const handleLocationUpdate = (location: { latitude: number; longitude: number }) => {
    setUserLocation(location)
  }

  const getConnectionStatus = () => {
    return isConnected && driverStatus === "online" ? "Connected" : "Disconnected"
  }

  const getConnectionColor = () => {
    return isConnected && driverStatus === "online" ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected && driverStatus === "online" ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${getConnectionColor()}`}>{getConnectionStatus()}</span>
              {busLocationData && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  {busLocationData.speed.toFixed(0)} km/h
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {selectedBus.connectedPassengers}/{selectedBus.capacity}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>
          {lastUpdate && (
            <div className="mt-2 text-xs text-muted-foreground">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map View */}
      {currentView === "map" && (
        <LeafletMap 
          selectedBus={selectedBus} 
          busLocation={busLocationData || undefined} 
          onLocationUpdate={handleLocationUpdate} 
        />
      )}

      {/* Timeline View */}
      {currentView === "timeline" && <BusTimeline selectedBus={selectedBus} busLocation={busLocationData} />}

      {/* Journey Information - only show in map view to avoid duplication */}
      {currentView === "map" && selectedBus.journeyDetails && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Journey Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{selectedBus.journeyDetails.fromStop.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">Start</span>
              </div>

              <div className="ml-6 border-l-2 border-dashed border-muted-foreground/30 pl-4 py-2">
                <p className="text-sm text-muted-foreground">
                  {selectedBus.journeyDetails.stopsInBetween.length} intermediate stops
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{selectedBus.journeyDetails.toStop.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">End</span>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Stops:</span>
                  <span className="font-medium">{selectedBus.journeyDetails.totalStopsInJourney}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Time:</span>
                  <span className="font-medium">{selectedBus.journeyDetails.estimatedJourneyTime}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status Info */}
      {!isConnected && (
        <Card>
          <CardContent className="p-4 text-center">
            <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Connecting to real-time updates...</p>
            <p className="text-xs text-muted-foreground mt-1">Make sure you have an internet connection</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
