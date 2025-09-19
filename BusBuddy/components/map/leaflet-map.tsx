"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Zap } from "lucide-react"
import type { BusSearchResult } from "@/lib/bus-api"

// Ensure Leaflet CSS is available
const leafletCSS = `
  .leaflet-container {
    height: 400px;
    width: 100%;
    background: #f9f9f9;
  }
  .leaflet-tile-pane {
    z-index: 200;
  }
  .leaflet-overlay-pane {
    z-index: 400;
  }
  .leaflet-control-container {
    z-index: 800;
  }
`

// Leaflet types and imports
declare global {
  interface Window {
    L: any
  }
}

interface LeafletMapProps {
  selectedBus: BusSearchResult | null
  busLocation?: {
    latitude: number
    longitude: number
    speed: number
    heading: number
    lastUpdated: string
  }
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void
}

export function LeafletMap({ selectedBus, busLocation, onLocationUpdate }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const busMarkerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isTrackingUser, setIsTrackingUser] = useState(false)

  // Load Leaflet library and CSS
  useEffect(() => {
    const loadLeaflet = async () => {
      // Check if already loaded
      if (window.L) {
        setIsMapLoaded(true)
        return
      }

      try {
        // Load CSS first
        if (!document.querySelector('link[href*="leaflet"]')) {
          // Inject basic CSS first
          const style = document.createElement('style')
          style.textContent = leafletCSS
          document.head.appendChild(style)
          
          const cssUrls = [
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
            'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'
          ]
          
          let cssLoaded = false
          for (const cssUrl of cssUrls) {
            try {
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = cssUrl
              link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
              link.crossOrigin = ''
              
              await new Promise((resolve, reject) => {
                link.onload = () => {
                  console.log(`Leaflet CSS loaded from: ${cssUrl}`)
                  cssLoaded = true
                  resolve(true)
                }
                link.onerror = () => reject(new Error(`Failed to load CSS from ${cssUrl}`))
                document.head.appendChild(link)
              })
              break
            } catch (error) {
              console.warn(`Failed to load CSS from ${cssUrl}:`, error)
              continue
            }
          }
          
          if (!cssLoaded) {
            console.error('Failed to load Leaflet CSS from all sources')
            setMapError("Failed to load map styles. Please check your internet connection.")
            return
          }
        }

        // Load JavaScript
        const scriptUrls = [
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
          'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'
        ]

        for (const scriptUrl of scriptUrls) {
          try {
            const script = document.createElement('script')
            script.src = scriptUrl
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
            script.crossOrigin = ''
            
            await new Promise((resolve, reject) => {
              script.onload = () => {
                console.log(`Leaflet JS loaded from: ${scriptUrl}`)
                if (window.L) {
                  setIsMapLoaded(true)
                  resolve(true)
                } else {
                  reject(new Error('Leaflet object not available'))
                }
              }
              script.onerror = () => reject(new Error(`Failed to load script from ${scriptUrl}`))
              document.head.appendChild(script)
            })
            break
          } catch (error) {
            console.warn(`Failed to load JS from ${scriptUrl}:`, error)
            continue
          }
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error)
        setMapError("Failed to load map resources. Please check your internet connection.")
      }
    }

    loadLeaflet()
  }, [])  // Initialize map with fallback tile providers
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = window.L

    try {
      // Create map instance with error handling
      const map = L.map(mapRef.current, {
        center: [28.6139, 77.209], // Default to Delhi
        zoom: 13,
        zoomControl: true,
        preferCanvas: true, // Better performance
        worldCopyJump: false,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
      })

      console.log("Map instance created successfully")

      // Simple, direct tile loading
      const tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
        subdomains: 'abcd'
      })

      tileLayer.on('tileload', () => {
        console.log('Tiles loaded successfully')
      })

      tileLayer.on('tileerror', (e: any) => {
        console.error('Tile loading error:', e)
        console.log('Trying OpenStreetMap as fallback...')
        // Remove failed layer and try fallback
        map.removeLayer(tileLayer)
        
        const fallbackLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        })
        
        fallbackLayer.on('tileerror', (fallbackError: any) => {
          console.error('Fallback tile loading error:', fallbackError)
          // Try one more fallback
          map.removeLayer(fallbackLayer)
          
          const lastFallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            subdomains: 'abc'
          })
          
          lastFallbackLayer.addTo(map)
        })
        
        fallbackLayer.addTo(map)
      })

      tileLayer.addTo(map)

      mapInstanceRef.current = map

      // Force map to recognize its container size
      setTimeout(() => {
        map.invalidateSize()
      }, 100)

      // Get user location with better error handling
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const userPos = { lat: latitude, lng: longitude }
            setUserLocation(userPos)

            // Add user location marker
            const userIcon = L.divIcon({
              className: "user-location-marker",
              html: '<div style="background: #6366f1; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })

            userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
              .addTo(map)
              .bindPopup("Your Location")

            // Center map on user location
            map.setView([latitude, longitude], 15)

            if (onLocationUpdate) {
              onLocationUpdate({ latitude, longitude })
            }
          },
          (error) => {
            console.error("Error getting user location:", error)
            // Keep default center if geolocation fails
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        )
      }

    } catch (error) {
      console.error("Error initializing map:", error)
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        } catch (error) {
          console.error("Error cleaning up map:", error)
        }
      }
    }
  }, [isMapLoaded, onLocationUpdate])

  // Update bus location and route
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedBus) return

    const L = window.L
    const map = mapInstanceRef.current

    // Clear existing route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
    }

    // Draw route if available
    if (selectedBus.journeyDetails) {
      const stops = [
        selectedBus.journeyDetails.fromStop,
        ...selectedBus.journeyDetails.stopsInBetween,
        selectedBus.journeyDetails.toStop,
      ]

      // Create route line
      const routeCoords = stops.map((stop) => [stop.latitude, stop.longitude])
      routeLayerRef.current = L.polyline(routeCoords, {
        color: "#6366f1",
        weight: 4,
        opacity: 0.7,
      }).addTo(map)

      // Add stop markers
      stops.forEach((stop, index) => {
        const isStart = index === 0
        const isEnd = index === stops.length - 1

        const stopIcon = L.divIcon({
          className: "bus-stop-marker",
          html: `<div style="
            background: ${isStart ? "#10b981" : isEnd ? "#ef4444" : "#6366f1"};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">${index + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`
            <div style="text-align: center;">
              <strong>${stop.name}</strong><br>
              <small>${isStart ? "Start" : isEnd ? "End" : "Stop"} ${index + 1}</small>
            </div>
          `)
      })

      // Fit map to route bounds
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [20, 20] })
    }
  }, [selectedBus])

  // Update bus marker location
  useEffect(() => {
    if (!mapInstanceRef.current || !busLocation) return

    const L = window.L
    const map = mapInstanceRef.current

    // Remove existing bus marker
    if (busMarkerRef.current) {
      map.removeLayer(busMarkerRef.current)
    }

    // Create bus icon with direction
    const busIcon = L.divIcon({
      className: "bus-marker",
      html: `<div style="
        background: #374151;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(${busLocation.heading}deg);
      ">🚌</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    // Add bus marker
    busMarkerRef.current = L.marker([busLocation.latitude, busLocation.longitude], { icon: busIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center;">
          <strong>${selectedBus?.busNumber}</strong><br>
          <small>Speed: ${busLocation.speed} km/h</small><br>
          <small>Updated: ${new Date(busLocation.lastUpdated).toLocaleTimeString()}</small>
        </div>
      `)

    // Center map on bus if tracking
    if (isTrackingUser) {
      map.setView([busLocation.latitude, busLocation.longitude], map.getZoom())
    }
  }, [busLocation, selectedBus, isTrackingUser])

  const centerOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16)
      setIsTrackingUser(false)
    }
  }

  const centerOnBus = () => {
    if (busLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([busLocation.latitude, busLocation.longitude], 16)
      setIsTrackingUser(true)
    }
  }

  const calculateETA = () => {
    if (!userLocation || !busLocation) return "N/A"

    // Simple distance calculation (in reality, you'd use routing)
    const distance =
      Math.sqrt(
        Math.pow(busLocation.latitude - userLocation.lat, 2) + Math.pow(busLocation.longitude - userLocation.lng, 2),
      ) * 111000 // Rough conversion to meters

    const speed = busLocation.speed || 20 // Default speed if not available
    const timeMinutes = Math.round((distance / 1000 / speed) * 60)

    return timeMinutes > 0 ? `${timeMinutes} min` : "Arriving"
  }

  if (!isMapLoaded && !mapError) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mapError) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-2">Map unavailable</p>
            <p className="text-xs text-muted-foreground">{mapError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => {
                setMapError(null)
                setIsMapLoaded(false)
                // Retry loading
                window.location.reload()
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card className="overflow-hidden">
        <div 
          ref={mapRef} 
          className="h-96 w-full"
          style={{
            background: '#f9f9f9',
            minHeight: '384px',
            position: 'relative'
          }}
        />
      </Card>

      {/* Map Controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={centerOnUser}
          disabled={!userLocation}
          className="flex-1 bg-transparent"
        >
          <Navigation className="h-4 w-4 mr-2" />
          My Location
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={centerOnBus}
          disabled={!busLocation}
          className="flex-1 bg-transparent"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Bus Location
        </Button>
      </div>

      {/* Bus Status Card */}
      {selectedBus && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
                  {selectedBus.busNumber}
                </div>
                <span
                  className={`text-sm font-medium ${selectedBus.isDriverOnline ? "text-green-600" : "text-red-600"}`}
                >
                  {selectedBus.isDriverOnline ? "Online" : "Offline"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">ETA: {calculateETA()}</div>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{selectedBus.routeName}</p>
              <p className="text-sm text-muted-foreground">Driver: {selectedBus.driverName}</p>

              {busLocation && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {busLocation.speed} km/h
                  </span>
                  <span>Updated: {new Date(busLocation.lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
