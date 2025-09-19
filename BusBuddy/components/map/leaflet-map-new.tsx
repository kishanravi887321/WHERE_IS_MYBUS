"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Zap } from "lucide-react"
import type { BusSearchResult } from "@/lib/bus-api"

// Global declarations
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
  const routeControlRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isTrackingUser, setIsTrackingUser] = useState(false)

  // Load Leaflet and Routing Machine
  useEffect(() => {
    const loadMapLibraries = async () => {
      if (window.L && window.L.Routing) {
        setIsMapLoaded(true)
        return
      }

      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const leafletCSS = document.createElement('link')
          leafletCSS.rel = 'stylesheet'
          leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
          leafletCSS.crossOrigin = ''
          document.head.appendChild(leafletCSS)
        }

        // Load Routing Machine CSS
        if (!document.querySelector('link[href*="leaflet-routing-machine"]')) {
          const routingCSS = document.createElement('link')
          routingCSS.rel = 'stylesheet'
          routingCSS.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css'
          document.head.appendChild(routingCSS)
        }

        // Load Leaflet JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const leafletJS = document.createElement('script')
            leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
            leafletJS.crossOrigin = ''
            leafletJS.onload = () => resolve(true)
            leafletJS.onerror = () => reject(new Error('Failed to load Leaflet'))
            document.head.appendChild(leafletJS)
          })
        }

        // Load Leaflet Routing Machine
        if (!window.L?.Routing) {
          await new Promise((resolve, reject) => {
            const routingJS = document.createElement('script')
            routingJS.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'
            routingJS.onload = () => resolve(true)
            routingJS.onerror = () => reject(new Error('Failed to load Routing Machine'))
            document.head.appendChild(routingJS)
          })
        }

        console.log('All map libraries loaded successfully')
        setIsMapLoaded(true)
      } catch (error) {
        console.error('Error loading map libraries:', error)
        setMapError('Failed to load map components. Please refresh the page.')
      }
    }

    loadMapLibraries()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = window.L
    
    try {
      // Create map
      const map = L.map(mapRef.current, {
        center: [28.6139, 77.209], // Delhi coordinates
        zoom: 13,
        zoomControl: true
      })

      console.log('Map created successfully')

      // Use ESRI World Street Map (very reliable)
      const tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        maxZoom: 18
      })

      tileLayer.on('tileerror', () => {
        console.log('ESRI tiles failed, trying CARTO...')
        map.removeLayer(tileLayer)
        
        // Fallback to CARTO
        const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd'
        })

        cartoLayer.on('tileerror', () => {
          console.log('CARTO failed, trying OpenStreetMap...')
          map.removeLayer(cartoLayer)
          
          // Final fallback to OpenStreetMap
          const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
          })
          osmLayer.addTo(map)
        })
        
        cartoLayer.addTo(map)
      })

      tileLayer.on('tileload', () => {
        console.log('ESRI tiles loaded successfully')
      })

      tileLayer.addTo(map)
      mapInstanceRef.current = map

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const userPos = { lat: latitude, lng: longitude }
            setUserLocation(userPos)
            
            // Add user marker
            if (userMarkerRef.current) {
              map.removeLayer(userMarkerRef.current)
            }
            
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: L.divIcon({
                className: 'user-marker',
                html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>',
                iconSize: [18, 18],
                iconAnchor: [9, 9]
              })
            }).addTo(map)
            
            map.setView([latitude, longitude], 15)
            
            if (onLocationUpdate) {
              onLocationUpdate({ latitude, longitude })
            }
          },
          (error) => {
            console.warn('Geolocation error:', error)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        )
      }

    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('Failed to initialize map. Please refresh the page.')
    }
  }, [isMapLoaded, onLocationUpdate])

  // Update bus location and routing
  useEffect(() => {
    if (!mapInstanceRef.current || !busLocation) return

    const map = mapInstanceRef.current
    const L = window.L

    try {
      // Remove existing bus marker
      if (busMarkerRef.current) {
        map.removeLayer(busMarkerRef.current)
      }

      // Add new bus marker
      busMarkerRef.current = L.marker([busLocation.latitude, busLocation.longitude], {
        icon: L.divIcon({
          className: 'bus-marker',
          html: `
            <div style="
              background-color: #ef4444;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            ">🚌</div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map)

      // Add popup with bus info
      busMarkerRef.current.bindPopup(`
        <div style="text-align: center; min-width: 150px;">
          <strong>${selectedBus?.busNumber || 'Bus'}</strong><br>
          <small>Speed: ${busLocation.speed} km/h</small><br>
          <small>Updated: ${new Date(busLocation.lastUpdated).toLocaleTimeString()}</small>
        </div>
      `)

      // Add routing if user location is available
      if (userLocation && window.L.Routing) {
        // Remove existing route
        if (routeControlRef.current) {
          map.removeControl(routeControlRef.current)
        }

        // Create new route
        routeControlRef.current = L.Routing.control({
          waypoints: [
            L.latLng(userLocation.lat, userLocation.lng),
            L.latLng(busLocation.latitude, busLocation.longitude)
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null, // Don't create markers, we have our own
          lineOptions: {
            styles: [
              { color: '#3b82f6', weight: 4, opacity: 0.7 }
            ]
          },
          show: false, // Hide the routing panel
          collapsible: true
        }).addTo(map)
      }

      // Center map on bus if tracking
      if (isTrackingUser) {
        map.setView([busLocation.latitude, busLocation.longitude], map.getZoom())
      }
    } catch (error) {
      console.error('Error updating bus location:', error)
    }
  }, [busLocation, selectedBus, userLocation, isTrackingUser])

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

    const distance = Math.sqrt(
      Math.pow(busLocation.latitude - userLocation.lat, 2) + 
      Math.pow(busLocation.longitude - userLocation.lng, 2)
    ) * 111000 // Rough conversion to meters

    const speed = busLocation.speed || 20
    const timeMinutes = Math.round((distance / 1000 / speed) * 60)

    return timeMinutes > 0 ? `${timeMinutes} min` : "Arriving"
  }

  if (!isMapLoaded && !mapError) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map and routing...</p>
            <p className="text-xs text-muted-foreground mt-1">Please wait a moment</p>
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
              onClick={() => window.location.reload()}
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
      {/* Fullscreen Map Container */}
      <Card className="overflow-hidden">
        <div 
          ref={mapRef} 
          className="h-[70vh] md:h-[80vh] w-full"
          style={{
            background: '#f0f0f0',
            minHeight: '500px'
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