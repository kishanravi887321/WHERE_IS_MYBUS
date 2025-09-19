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
}
