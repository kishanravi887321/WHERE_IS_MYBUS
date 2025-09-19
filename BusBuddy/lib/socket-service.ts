import { io, type Socket } from "socket.io-client"

export interface BusLocationUpdate {
  busId: string
  location: {
    latitude: number
    longitude: number
  }
  speed: number
  heading: number
  timestamp: string
  driverInfo: {
    name: string
  }
}

export interface DriverStatusUpdate {
  busId: string
  driverInfo?: {
    name: string
    socketId: string
  }
  reason?: string
  timestamp: string
}

export interface BusRouteInfo {
  busId: string
  route: {
    routeName: string
    stops: Array<{
      name: string
      latitude: number
      longitude: number
      order: number
    }>
  }
  totalStops: number
}

export class SocketService {
  private static instance: SocketService
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001"

      this.socket = io(serverUrl, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
      })

      this.socket.on("connect", () => {
        this.isConnected = true
        this.reconnectAttempts = 0

        // Don't auto-identify - let components handle identification
        resolve()
      })

      this.socket.on("disconnect", (reason) => {
        this.isConnected = false

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => {
            this.connect()
          }, 2000 * this.reconnectAttempts)
        }
      })

      this.socket.on("connect_error", (error) => {
        this.isConnected = false
        reject(error)
      })

      // Set up event listeners
      this.setupEventListeners()

      // Connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error("Connection timeout"))
        }
      }, 10000)
    })
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Identification responses
    this.socket.on("identify:success", (data) => {
      this.emit("passenger:identified", data)
    })

    this.socket.on("identify:error", (error) => {
      this.emit("passenger:error", error)
    })

    // Bus location updates
    this.socket.on("bus:location", (data: BusLocationUpdate) => {
      this.emit("bus:location", data)
    })

    // Driver status updates
    this.socket.on("driver:online", (data: DriverStatusUpdate) => {
      this.emit("driver:online", data)
    })

    this.socket.on("driver:offline", (data: DriverStatusUpdate) => {
      this.emit("driver:offline", data)
    })

    // Route information
    this.socket.on("bus:route", (data: BusRouteInfo) => {
      this.emit("bus:route", data)
    })

    // Passenger responses
    this.socket.on("passenger:joined", (data) => {
      this.emit("passenger:joined", data)
    })

    this.socket.on("passenger:error", (error) => {
      this.emit("passenger:error", error)
    })

    this.socket.on("passenger:info", (info) => {
      this.emit("passenger:info", info)
    })

    // General errors
    this.socket.on("error", (error) => {
      this.emit("socket:error", error)
    })
  }

  private identifyAsPassenger() {
    if (!this.socket) return

    this.socket.emit("identify", {
      type: "passenger",
    })
  }

  // Passenger methods
  joinBusTracking(
    busId: string,
    passengerInfo?: {
      name?: string
      boarding_stop?: string
      destination_stop?: string
    },
  ) {
    if (!this.socket) {
      return
    }

    this.socket.emit("passenger:join", {
      busId,
      passengerInfo: passengerInfo || {},
    })
  }

  leaveBusTracking(busId: string) {
    if (!this.socket) return

    this.socket.emit("passenger:leave", {
      busId,
    })
  }

  requestCurrentLocation(busId: string) {
    if (!this.socket) return

    this.socket.emit("passenger:location:request", {
      busId,
    })
  }

  requestRouteInfo(busId: string) {
    if (!this.socket) return

    this.socket.emit("passenger:route:request", {
      busId,
    })
  }

  // Passenger connection method
  connectAsPassenger(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connect()
        .then(() => {
          // Identify as passenger
          this.identifyAsPassenger()
          resolve()
        })
        .catch(reject)
    })
  }

  // Driver connection method
  connectAsDriver(token: string, busId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // First connect to socket
      this.connect()
        .then(() => {
          // Then identify as driver
          this.identifyAsDriver(token, busId)
          
          // Listen for identification success/error
          const onSuccess = () => {
            this.socket?.off("identify:success", onSuccess)
            this.socket?.off("identify:error", onError)
            resolve()
          }
          
          const onError = (error: any) => {
            this.socket?.off("identify:success", onSuccess)
            this.socket?.off("identify:error", onError)
            reject(new Error(error.message || "Driver identification failed"))
          }
          
          this.socket?.on("identify:success", onSuccess)
          this.socket?.on("identify:error", onError)
        })
        .catch(reject)
    })
  }

  // Driver methods (for driver dashboard)
  identifyAsDriver(token: string, busId: string) {
    if (!this.socket) return

    this.socket.emit("identify", {
      type: "driver",
      token,
      busId,
    })
  }

  joinAsDriver(busId: string, driverInfo: { name: string; phone?: string }) {
    if (!this.socket) return

    this.socket.emit("driver:join", {
      busId,
      driverInfo,
    })
  }

  sendLocationUpdate(
    busId: string,
    location: {
      latitude: number
      longitude: number
    },
    speed: number,
    heading: number,
  ) {
    if (!this.socket) return

    this.socket.emit("driver:location", {
      busId,
      location,
      speed,
      heading,
      timestamp: new Date().toISOString(),
    })
  }

  goOffline(busId: string, reason?: string) {
    if (!this.socket) return

    this.socket.emit("driver:offline", {
      busId,
      reason,
    })
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return

    if (callback) {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    } else {
      this.listeners.set(event, [])
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          // Silent error handling
        }
      })
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
    this.listeners.clear()
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  getConnectionStatus(): "connected" | "connecting" | "disconnected" {
    if (this.isConnected && this.socket?.connected) {
      return "connected"
    } else if (this.socket && !this.socket.connected) {
      return "connecting"
    } else {
      return "disconnected"
    }
  }
}
