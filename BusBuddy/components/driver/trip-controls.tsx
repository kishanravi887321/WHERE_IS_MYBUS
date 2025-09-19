"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDriverSocket, useGeolocation } from "@/hooks/use-driver"
import { Play, Square, Navigation, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TripControlsProps {
  busId: string
  token: string
  driverName: string
  onTripEnd: () => void
}

export function TripControls({ busId, token, driverName, onTripEnd }: TripControlsProps) {
  const [isTripActive, setIsTripActive] = useState(false)
  const [connectedPassengers, setConnectedPassengers] = useState(0)
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null)

  const { isConnected, isAuthenticated, connectAsDriver, joinAsDriver, sendLocationUpdate, goOffline } =
    useDriverSocket()
  const { location, isTracking, error, retryCount, maxRetries, startTracking, stopTracking, retryTracking } = useGeolocation()
  const { toast } = useToast()

  // Connect as driver on component mount
  useEffect(() => {
    const connect = async () => {
      try {
        await connectAsDriver(token, busId)
      } catch (error) {
        toast({
          title: "Connection failed",
          description: "Failed to connect to the server",
          variant: "destructive",
        })
      }
    }
    connect()
  }, [connectAsDriver, token, busId, toast])

  // Join as driver once authenticated
  useEffect(() => {
    if (isAuthenticated && !isTripActive) {
      joinAsDriver(busId, { name: driverName })
    }
  }, [isAuthenticated, busId, driverName, joinAsDriver, isTripActive])

  // Send location updates when tracking
  useEffect(() => {
    if (location && isTripActive && isConnected) {
      sendLocationUpdate(
        busId,
        { latitude: location.latitude, longitude: location.longitude },
        location.speed,
        location.heading,
      )
    }
  }, [location, isTripActive, isConnected, busId, sendLocationUpdate])

  const handleStartTrip = () => {
    if (!isConnected || !isAuthenticated) {
      toast({
        title: "Not connected",
        description: "Please wait for connection to establish",
        variant: "destructive",
      })
      return
    }

    const cleanup = startTracking()
    setIsTripActive(true)
    setTripStartTime(new Date())

    toast({
      title: "Trip started",
      description: "You are now sharing your location with passengers",
    })

    return cleanup
  }

  const handleEndTrip = () => {
    stopTracking()
    setIsTripActive(false)
    setTripStartTime(null)

    goOffline(busId, "Trip completed")

    toast({
      title: "Trip ended",
      description: "Location sharing has been stopped",
    })

    onTripEnd()
  }

  const getTripDuration = () => {
    if (!tripStartTime) return "00:00:00"

    const now = new Date()
    const diff = now.getTime() - tripStartTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getConnectionStatus = () => {
    if (isConnected && isAuthenticated) return "Connected"
    if (isConnected) return "Authenticating"
    return "Disconnected"
  }

  const getConnectionColor = () => {
    if (isConnected && isAuthenticated) return "text-green-600"
    if (isConnected) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected && isAuthenticated ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${getConnectionColor()}`}>{getConnectionStatus()}</span>
            </div>
            <Badge variant={isTripActive ? "default" : "secondary"}>
              {isTripActive ? "Trip Active" : "Trip Inactive"}
            </Badge>
          </div>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-red-800">Location Error</h4>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                  {error.includes("denied") && (
                    <div className="mt-2 text-xs text-red-600">
                      <p>💡 <strong>How to fix:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Click the location icon 📍 in your browser address bar</li>
                        <li>Select "Always allow" for location access</li>
                        <li>Refresh the page and try again</li>
                      </ul>
                    </div>
                  )}
                  {error.includes("timeout") && (
                    <div className="mt-2 text-xs text-red-600">
                      <p>💡 <strong>Tip:</strong> Move to an area with better GPS signal or try again in a moment.</p>
                    </div>
                  )}
                  {retryCount < maxRetries && !error.includes("denied") && (
                    <button
                      onClick={retryTracking}
                      className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded-md border border-red-300 transition-colors"
                    >
                      Retry Location ({retryCount}/{maxRetries})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-accent" />
            Trip Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isTripActive ? (
            <Button onClick={handleStartTrip} className="w-full" size="lg" disabled={!isConnected || !isAuthenticated}>
              <Play className="h-4 w-4 mr-2" />
              Start Trip
            </Button>
          ) : (
            <Button onClick={handleEndTrip} variant="destructive" className="w-full" size="lg">
              <Square className="h-4 w-4 mr-2" />
              End Trip
            </Button>
          )}

          {isTripActive && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{getTripDuration()}</div>
                <div className="text-xs text-muted-foreground">Trip Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{connectedPassengers}</div>
                <div className="text-xs text-muted-foreground">Passengers</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Location */}
      {location && isTripActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Speed:</span>
                <span className="font-medium ml-2">{location.speed.toFixed(1)} km/h</span>
              </div>
              <div>
                <span className="text-muted-foreground">Heading:</span>
                <span className="font-medium ml-2">{location.heading.toFixed(0)}°</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Lat: {location.latitude.toFixed(6)}</p>
              <p>Lng: {location.longitude.toFixed(6)}</p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">Broadcasting location to passengers</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!isTripActive && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2">Instructions:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Ensure GPS is enabled on your device</li>
              <li>• Click "Start Trip" to begin sharing location</li>
              <li>• Passengers will see your real-time location</li>
              <li>• Click "End Trip" when your route is complete</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
