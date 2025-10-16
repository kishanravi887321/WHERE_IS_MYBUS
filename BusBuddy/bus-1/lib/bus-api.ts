export interface BusStop {
  name: string
  latitude: number
  longitude: number
  order: number
}

export interface Bus {
  busId: string
  busNumber: string
  routeName: string
  driverName: string
  capacity: number
  isActive: boolean
  isDriverOnline: boolean
  connectedPassengers: number
  route: {
    stops: BusStop[]
  }
  latestLocation?: {
    location: {
      latitude: number
      longitude: number
    }
    speed: number
    heading: number
    lastUpdated: string
  }
}

export interface BusSearchResult {
  busId: string
  busNumber: string
  routeName: string
  driverName: string
  capacity: number
  isDriverOnline: boolean
  connectedPassengers: number
  route?: {
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
      _id?: string
    }>
    routeCoordinates?: Array<{
      latitude: number
      longitude: number
      order: number
    }>
  }
  journeyDetails?: {
    fromStop: BusStop
    toStop: BusStop
    stopsInBetween: BusStop[]
    totalStopsInJourney: number
    estimatedJourneyTime: string
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export class BusApiService {
  private static instance: BusApiService

  private constructor() {}

  static getInstance(): BusApiService {
    if (!BusApiService.instance) {
      BusApiService.instance = new BusApiService()
    }
    return BusApiService.instance
  }

  async getAllBuses(): Promise<Bus[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/buses?isActive=true`)
      const data = await response.json()

      if (data.success) {
        return data.data.buses
      }
      return []
    } catch (error) {
      console.error("Error fetching buses:", error)
      return []
    }
  }

  async getBusById(busId: string): Promise<Bus | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/buses/${busId}`)
      const data = await response.json()

      if (data.success) {
        return data.data
      }
      return null
    } catch (error) {
      console.error("Error fetching bus:", error)
      return null
    }
  }

  async searchBusesByRoute(fromStop: string, toStop: string): Promise<BusSearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/buses/route/${encodeURIComponent(fromStop)}/${encodeURIComponent(toStop)}?includeDriverStatus=true`,
      )
      const data = await response.json()

      if (data.success) {
        return data.data.availableBuses
      }
      return []
    } catch (error) {
      console.error("Error searching buses:", error)
      return []
    }
  }

  async getBusesByStop(stopName: string): Promise<BusSearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/buses/stop/${encodeURIComponent(stopName)}?includeDriverStatus=true`,
      )
      const data = await response.json()

      if (data.success) {
        return data.data.availableBuses
      }
      return []
    } catch (error) {
      console.error("Error fetching buses by stop:", error)
      return []
    }
  }

  async searchBuses(query: string, latitude?: number, longitude?: number): Promise<Bus[]> {
    try {
      const params = new URLSearchParams({ query })
      if (latitude && longitude) {
        params.append("latitude", latitude.toString())
        params.append("longitude", longitude.toString())
      }

      const response = await fetch(`${API_BASE_URL}/api/buses/search?${params}`)
      const data = await response.json()

      if (data.success) {
        return data.data.buses
      }
      return []
    } catch (error) {
      console.error("Error searching buses:", error)
      return []
    }
  }

  async getOrganizationBuses(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orgs/get-buses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`
        }
      })
      const data = await response.json()

      if (data.status === 'success') {
        return data.data.buses
      }
      return []
    } catch (error) {
      console.error("Error fetching organization buses:", error)
      return []
    }
  }

  async makeBusInactive(busId: string, secretKey: string): Promise<{success: boolean, message: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/buses/make-inactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`
        },
        body: JSON.stringify({
          busId: busId,
          secretKey: secretKey
        })
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Bus made inactive successfully'
        }
      } else {
        return {
          success: false,
          message: data.message || 'Failed to make bus inactive'
        }
      }
    } catch (error) {
      console.error("Error making bus inactive:", error)
      return {
        success: false,
        message: 'Network error. Please try again.'
      }
    }
  }
}
