"use client"

import { useEffect, useState, useCallback } from "react"
import { SocketService, type BusLocationUpdate, type DriverStatusUpdate } from "@/lib/socket-service"

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected")
  const [socketService] = useState(() => SocketService.getInstance())

  useEffect(() => {
    const connectSocket = async () => {
      try {
        setConnectionStatus("connecting")
        await socketService.connect()
        setIsConnected(true)
        setConnectionStatus("connected")
      } catch (error) {
        console.error("Failed to connect to socket:", error)
        setIsConnected(false)
        setConnectionStatus("disconnected")
      }
    }

    connectSocket()

    // Set up connection status listeners
    const handleIdentified = () => {
      setIsConnected(true)
      setConnectionStatus("connected")
    }

    const handleError = () => {
      setIsConnected(false)
      setConnectionStatus("disconnected")
    }

    socketService.on("passenger:identified", handleIdentified)
    socketService.on("socket:error", handleError)

    return () => {
      socketService.off("passenger:identified", handleIdentified)
      socketService.off("socket:error", handleError)
    }
  }, [socketService])

  const joinBusTracking = useCallback(
    (busId: string, passengerInfo?: any) => {
      socketService.joinBusTracking(busId, passengerInfo)
    },
    [socketService],
  )

  const leaveBusTracking = useCallback(
    (busId: string) => {
      socketService.leaveBusTracking(busId)
    },
    [socketService],
  )

  const requestCurrentLocation = useCallback(
    (busId: string) => {
      socketService.requestCurrentLocation(busId)
    },
    [socketService],
  )

  const requestRouteInfo = useCallback(
    (busId: string) => {
      socketService.requestRouteInfo(busId)
    },
    [socketService],
  )

  return {
    isConnected,
    connectionStatus,
    socketService,
    joinBusTracking,
    leaveBusTracking,
    requestCurrentLocation,
    requestRouteInfo,
  }
}

export function useBusTracking(busId: string | null) {
  const { socketService, isConnected, joinBusTracking, leaveBusTracking } = useSocket()
  const [busLocation, setBusLocation] = useState<BusLocationUpdate | null>(null)
  const [driverStatus, setDriverStatus] = useState<"online" | "offline">("offline")
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    if (!busId || !isConnected) return

    // Join bus tracking
    joinBusTracking(busId, {
      name: "Passenger",
      boarding_stop: "Current Location",
    })

    // Set up event listeners
    const handleLocationUpdate = (data: BusLocationUpdate) => {
      if (data.busId === busId) {
        setBusLocation(data)
        setLastUpdate(data.timestamp)
        setDriverStatus("online")
      }
    }

    const handleDriverOnline = (data: DriverStatusUpdate) => {
      if (data.busId === busId) {
        setDriverStatus("online")
      }
    }

    const handleDriverOffline = (data: DriverStatusUpdate) => {
      if (data.busId === busId) {
        setDriverStatus("offline")
      }
    }

    const handlePassengerJoined = (data: any) => {
      console.log("Joined bus tracking:", data)
    }

    const handlePassengerError = (error: any) => {
      console.error("Passenger tracking error:", error)
    }

    socketService.on("bus:location", handleLocationUpdate)
    socketService.on("driver:online", handleDriverOnline)
    socketService.on("driver:offline", handleDriverOffline)
    socketService.on("passenger:joined", handlePassengerJoined)
    socketService.on("passenger:error", handlePassengerError)

    // Request current location and route info
    socketService.requestCurrentLocation(busId)
    socketService.requestRouteInfo(busId)

    return () => {
      // Clean up listeners
      socketService.off("bus:location", handleLocationUpdate)
      socketService.off("driver:online", handleDriverOnline)
      socketService.off("driver:offline", handleDriverOffline)
      socketService.off("passenger:joined", handlePassengerJoined)
      socketService.off("passenger:error", handlePassengerError)

      // Leave bus tracking
      leaveBusTracking(busId)
    }
  }, [busId, isConnected, socketService, joinBusTracking, leaveBusTracking])

  return {
    busLocation,
    driverStatus,
    lastUpdate,
    isConnected,
  }
}
