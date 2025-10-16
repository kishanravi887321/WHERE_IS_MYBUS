"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDriverSocket, useGeolocation } from "@/hooks/use-driver"
import {
  Play,
  Square,
  Navigation,
  Wifi,
  WifiOff,
  Zap,
  Users,
  Clock,
  Gauge,
  Compass,
  MapPin,
  AlertTriangle,
} from "lucide-react"
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
  const { location, isTracking, error, retryCount, maxRetries, startTracking, stopTracking, retryTracking } =
    useGeolocation()
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
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 hover:bg-blue-100 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              {isConnected && isAuthenticated ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{color: '#212153'}}>System Status</p>
              <p className={`text-xs ${getConnectionColor()}`}>{getConnectionStatus()}</p>
            </div>
          </div>

          <Badge
            variant={isTripActive ? "default" : "secondary"}
            className={`${
              isTripActive
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-gray-50 border-gray-200 text-gray-600"
            } font-medium`}
          >
            {isTripActive ? (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Trip Active</span>
              </div>
            ) : (
              "Trip Inactive"
            )}
          </Badge>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-700 mb-1">Location Error</h4>
                <p className="text-xs text-red-600 mb-3">{error}</p>

                {error.includes("denied") && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-3">
                    <p className="text-xs text-red-700 font-medium mb-2">🔧 Quick Fix:</p>
                    <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                      <li>Click the location icon 📍 in your browser address bar</li>
                      <li>Select "Always allow" for location access</li>
                      <li>Refresh the page and try again</li>
                    </ul>
                  </div>
                )}

                {retryCount < maxRetries && !error.includes("denied") && (
                  <Button
                    onClick={retryTracking}
                    size="sm"
                    className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"
                  >
                    Retry Location ({retryCount}/{maxRetries})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
          <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
            <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </div>
          <h3 className="text-base sm:text-lg font-bold" style={{color: '#212153'}}>Mission Control</h3>
        </div>

        {!isTripActive ? (
          <Button
            onClick={handleStartTrip}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
            disabled={!isConnected || !isAuthenticated}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                <Play className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold">Start Trip</p>
                <p className="text-xs opacity-90">Begin location sharing</p>
              </div>
            </div>
          </Button>
        ) : (
          <Button
            onClick={handleEndTrip}
            className="w-full h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                <Square className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold">End Trip</p>
                <p className="text-xs opacity-90">Stop location sharing</p>
              </div>
            </div>
          </Button>
        )}

        {isTripActive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
            <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all duration-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold font-mono truncate" style={{color: '#212153'}}>{getTripDuration()}</p>
                  <p className="text-xs text-gray-600">Trip Duration</p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-green-50 border border-green-100 hover:bg-green-100 transition-all duration-200">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-100">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold" style={{color: '#212153'}}>{connectedPassengers}</p>
                  <p className="text-xs text-gray-600">Passengers</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {location && isTripActive && (
        <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold" style={{color: '#212153'}}>Live Telemetry</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 rounded-xl bg-purple-50 border border-purple-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
                  <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-bold truncate" style={{color: '#212153'}}>{location.speed.toFixed(1)} km/h</p>
                  <p className="text-xs text-gray-600">Current Speed</p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-cyan-50 border border-cyan-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-100">
                  <Compass className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-bold truncate" style={{color: '#212153'}}>{location.heading.toFixed(0)}°</p>
                  <p className="text-xs text-gray-600">Heading</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-green-700 font-medium mb-1">GPS Coordinates</p>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-green-700 whitespace-nowrap">Broadcasting Live</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isTripActive && (
        <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold" style={{color: '#212153'}}>Quick Start Guide</h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {[
              "Ensure GPS is enabled on your device",
              "Click 'Start Trip' to begin sharing location",
              "Passengers will see your real-time location",
              "Click 'End Trip' when your route is complete",
            ].map((instruction, index) => (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0">
                  {index + 1}
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{instruction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
