const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export interface BusActivationResponse {
  message: string
  token: string // 6-digit OTP for driver authentication
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
