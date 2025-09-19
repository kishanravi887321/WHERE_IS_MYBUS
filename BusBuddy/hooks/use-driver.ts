"use client"

import { useEffect, useState, useCallback } from "react"
import { SocketService } from "@/lib/socket-service"

export function useDriverSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected")
  const [socketService] = useState(() => SocketService.getInstance())

  const connectAsDriver = useCallback(
    async (token: string, busId: string) => {
      try {
        setConnectionStatus("connecting")
        
        // Use the new connectAsDriver method that handles identification
        await socketService.connectAsDriver(token, busId)

        setIsConnected(true)
        setIsAuthenticated(true)
        setConnectionStatus("connected")
      } catch (error) {
        console.error("Failed to connect as driver:", error)
        setIsConnected(false)
        setIsAuthenticated(false)
        setConnectionStatus("disconnected")
        throw error
      }
    },
    [socketService],
  )

  const joinAsDriver = useCallback(
    (busId: string, driverInfo: { name: string; phone?: string }) => {
      socketService.joinAsDriver(busId, driverInfo)
    },
    [socketService],
  )

  const sendLocationUpdate = useCallback(
    (busId: string, location: { latitude: number; longitude: number }, speed: number, heading: number) => {
      socketService.sendLocationUpdate(busId, location, speed, heading)
    },
    [socketService],
  )

  const goOffline = useCallback(
    (busId: string, reason?: string) => {
      socketService.goOffline(busId, reason)
    },
    [socketService],
  )

  useEffect(() => {
    const handleDriverJoined = () => {
      setIsAuthenticated(true)
    }

    const handleDriverError = (error: any) => {
      console.error("Driver error:", error)
      setIsAuthenticated(false)
    }

    const handleIdentifySuccess = () => {
      setIsAuthenticated(true)
    }

    const handleIdentifyError = () => {
      setIsAuthenticated(false)
    }

    socketService.on("driver:joined", handleDriverJoined)
    socketService.on("driver:error", handleDriverError)
    socketService.on("identify:success", handleIdentifySuccess)
    socketService.on("identify:error", handleIdentifyError)

    return () => {
      socketService.off("driver:joined", handleDriverJoined)
      socketService.off("driver:error", handleDriverError)
      socketService.off("identify:success", handleIdentifySuccess)
      socketService.off("identify:error", handleIdentifyError)
    }
  }, [socketService])

  return {
    isConnected,
    isAuthenticated,
    connectionStatus,
    connectAsDriver,
    joinAsDriver,
    sendLocationUpdate,
    goOffline,
  }
}

export function useGeolocation() {
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    speed: number
    heading: number
  } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setIsTracking(true)
    setError(null)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords
        setLocation({
          latitude,
          longitude,
          speed: speed ? speed * 3.6 : 0, // Convert m/s to km/h
          heading: heading || 0,
        })
      },
      (error) => {
        console.error("Geolocation error:", error)
        setError(error.message)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      setIsTracking(false)
    }
  }, [])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
  }, [])

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
  }
}
