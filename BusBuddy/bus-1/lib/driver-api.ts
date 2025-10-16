const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export interface BusActivationResponse {
  message: string
  token: string // 6-digit OTP for driver authentication
  busInfo: {
    _id: string
    ownerEmail: string
    busId: string
    busNumber: string
    routeName: string
    driverName: string
    driverPhone: string
    secretKey: string
    capacity: number
    isActive: boolean
    createdAt: string
    updatedAt: string
    __v: number
    currentLocation: {
      latitude: number | null
      longitude: number | null
      lastUpdated: string
    }
    route: {
      startPoint: {
        name: string
        latitude: number
        longitude: number
      }
      endPoint: {
        name: string
        latitude: number
        longitude: number
      }
      stops: Array<{
        name: string
        latitude: number
        longitude: number
        order: number
        _id: string
      }>
    }
  }
}

export class DriverApiService {
  private static instance: DriverApiService

  private constructor() {}

  static getInstance(): DriverApiService {
    if (!DriverApiService.instance) {
      DriverApiService.instance = new DriverApiService()
    }
    return DriverApiService.instance
  }

  async activateBus(busId: string, secretKey: string): Promise<BusActivationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/buses/make-active`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ busId, secretKey }),
      })

      const data = await response.json()

      if (response.ok) {
        return data
      } else {
        throw new Error(data.message || "Failed to activate bus")
      }
    } catch (error) {
      console.error("Error activating bus:", error)
      throw error
    }
  }
}
