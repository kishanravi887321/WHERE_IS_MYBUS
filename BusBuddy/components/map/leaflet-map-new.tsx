"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Zap } from "lucide-react"
import type { BusSearchResult } from "@/lib/bus-api"
import "./map-styles.css"

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
  const routeMarkersRef = useRef<any[]>([])
  const busRouteLayerRef = useRef<any>(null)
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
        zoomControl: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        tap: true,
        tapTolerance: 15,
        maxZoom: 18,
        minZoom: 5
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

      // Center map on bus if tracking
      if (isTrackingUser) {
        map.setView([busLocation.latitude, busLocation.longitude], map.getZoom())
      }
    } catch (error) {
      console.error('Error updating bus location:', error)
    }
  }, [busLocation, selectedBus, isTrackingUser])

  // Display complete bus route with real routing when bus is selected
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedBus?.route || !window.L.Routing) return

    const map = mapInstanceRef.current
    const L = window.L

    try {
      // Remove existing routing
      if (routeControlRef.current) {
        map.removeControl(routeControlRef.current)
      }

      // Create waypoints for the complete bus route
      const routeWaypoints = []
      
      // Add start point
      routeWaypoints.push(L.latLng(selectedBus.route.startPoint.latitude, selectedBus.route.startPoint.longitude))
      
      // Add all intermediate stops in order
      if (selectedBus.route.stops && selectedBus.route.stops.length > 0) {
        const sortedStops = [...selectedBus.route.stops].sort((a, b) => a.order - b.order)
        sortedStops.forEach(stop => {
          routeWaypoints.push(L.latLng(stop.latitude, stop.longitude))
        })
      }
      
      // Add end point
      routeWaypoints.push(L.latLng(selectedBus.route.endPoint.latitude, selectedBus.route.endPoint.longitude))

      // Create routing control for the complete bus route
      if (routeWaypoints.length >= 2) {
        routeControlRef.current = L.Routing.control({
          waypoints: routeWaypoints,
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null, // Don't create markers, we have our own
          lineOptions: {
            styles: [
              { color: '#3b82f6', weight: 5, opacity: 0.9 }
            ]
          },
          show: false, // Hide the routing panel
          collapsible: true,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          })
        }).addTo(map)

        // Add a custom popup to the route
        routeControlRef.current.on('routesfound', function(e) {
          const routes = e.routes
          if (routes.length > 0) {
            const route = routes[0]
            const distance = (route.summary.totalDistance / 1000).toFixed(1)
            const time = Math.round(route.summary.totalTime / 60)
            
            // Add popup to the route line
            setTimeout(() => {
              if (routeControlRef.current._selectedRoute) {
                routeControlRef.current._selectedRoute.bindPopup(`
                  <div style="text-align: center; min-width: 150px;">
                    <strong>🛣️ Bus Route</strong><br>
                    <span style="color: #3b82f6; font-weight: bold;">${selectedBus.routeName}</span><br>
                    <small>📏 ${distance} km • ⏱️ ${time} min</small><br>
                    <small style="color: #3b82f6;">Real road route</small>
                  </div>
                `)
              }
            }, 100)
          }
        })

        console.log('Bus route created with', routeWaypoints.length, 'waypoints')
      }

    } catch (error) {
      console.error('Error creating bus route:', error)
    }
  }, [selectedBus])

  // Display complete bus route when bus is selected
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedBus) return

    const map = mapInstanceRef.current
    const L = window.L

    try {
      // Clear existing route markers and layers
      routeMarkersRef.current.forEach(marker => {
        map.removeLayer(marker)
      })
      routeMarkersRef.current = []

      if (busRouteLayerRef.current) {
        map.removeLayer(busRouteLayerRef.current)
      }

      // Get route data
      const route = selectedBus.route
      if (!route || !route.startPoint || !route.endPoint) return

      // Create waypoints for the complete route
      const waypoints = []
      const markers = []

      // Add start point
      waypoints.push([route.startPoint.latitude, route.startPoint.longitude])
      
      const startMarker = L.marker([route.startPoint.latitude, route.startPoint.longitude], {
        icon: L.divIcon({
          className: 'route-marker start-marker',
          html: `
            <div style="
              background-color: #22c55e;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            ">🚏</div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).addTo(map)

      startMarker.bindPopup(`
        <div style="text-align: center; min-width: 150px;">
          <strong>🚏 Start Point</strong><br>
          <span style="color: #22c55e; font-weight: bold;">${route.startPoint.name}</span><br>
          <small>Route: ${selectedBus.routeName}</small>
        </div>
      `)

      markers.push(startMarker)

      // Add intermediate stops
      if (route.stops && route.stops.length > 0) {
        const sortedStops = [...route.stops].sort((a, b) => a.order - b.order)
        
        sortedStops.forEach((stop, index) => {
          waypoints.push([stop.latitude, stop.longitude])
          
          const stopMarker = L.marker([stop.latitude, stop.longitude], {
            icon: L.divIcon({
              className: 'route-marker stop-marker',
              html: `
                <div style="
                  background-color: #3b82f6;
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 8px;
                  color: white;
                  font-weight: bold;
                ">${stop.order}</div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            })
          }).addTo(map)

          stopMarker.bindPopup(`
            <div style="text-align: center; min-width: 120px;">
              <strong>🚌 Stop ${stop.order}</strong><br>
              <span style="color: #3b82f6; font-weight: bold;">${stop.name}</span><br>
              <small>Route: ${selectedBus.routeName}</small>
            </div>
          `)

          markers.push(stopMarker)
        })
      }

      // Add end point
      waypoints.push([route.endPoint.latitude, route.endPoint.longitude])
      
      const endMarker = L.marker([route.endPoint.latitude, route.endPoint.longitude], {
        icon: L.divIcon({
          className: 'route-marker end-marker',
          html: `
            <div style="
              background-color: #ef4444;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            ">🏁</div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).addTo(map)

      endMarker.bindPopup(`
        <div style="text-align: center; min-width: 150px;">
          <strong>🏁 End Point</strong><br>
          <span style="color: #ef4444; font-weight: bold;">${route.endPoint.name}</span><br>
          <small>Route: ${selectedBus.routeName}</small>
        </div>
      `)

      markers.push(endMarker)

      // Store markers for cleanup
      routeMarkersRef.current = markers

      // Create route line
      if (waypoints.length > 1) {
        busRouteLayerRef.current = L.polyline(waypoints, {
          color: '#f59e0b',
          weight: 3,
          opacity: 0.6,
          dashArray: '15, 10'
        }).addTo(map)

        busRouteLayerRef.current.bindPopup(`
          <div style="text-align: center;">
            <strong>${selectedBus.routeName}</strong><br>
            <small>${route.startPoint.name} → ${route.endPoint.name}</small><br>
            <small style="color: #f59e0b;">🗺️ Static Route Path</small>
          </div>
        `)
      }

      // Fit map to show the complete route
      if (waypoints.length > 0) {
        const group = new L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.1))
      }

    } catch (error) {
      console.error('Error displaying bus route:', error)
    }
  }, [selectedBus])

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
      <Card className="h-[70vh] md:h-[80vh]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium text-muted-foreground">Loading map and routing...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mapError) {
    return (
      <Card className="h-[70vh] md:h-[80vh]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <p className="text-lg font-medium text-foreground mb-2">Map unavailable</p>
            <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
            <Button 
              variant="outline" 
              size="default" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry Loading
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
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={centerOnUser}
          disabled={!userLocation}
          className="flex-1 min-w-[120px] bg-transparent"
        >
          <Navigation className="h-4 w-4 mr-2" />
          My Location
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={centerOnBus}
          disabled={!busLocation}
          className="flex-1 min-w-[120px] bg-transparent"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Bus Location
        </Button>
        {selectedBus?.route && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (mapInstanceRef.current && routeMarkersRef.current.length > 0) {
                const group = new window.L.featureGroup(routeMarkersRef.current)
                mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
              }
            }}
            className="flex-1 min-w-[120px] bg-transparent"
          >
            <Zap className="h-4 w-4 mr-2" />
            Full Route
          </Button>
        )}
      </div>

      {/* Bus Status Card */}
      {selectedBus && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium">
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

            <div className="space-y-2">
              <p className="font-medium text-foreground">{selectedBus.routeName}</p>
              <p className="text-sm text-muted-foreground">Driver: {selectedBus.driverName}</p>
              
              {/* Route Information */}
              {selectedBus.route && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-2">ROUTE</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">🚏 {selectedBus.route.startPoint.name}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-red-600">🏁 {selectedBus.route.endPoint.name}</span>
                  </div>
                  {selectedBus.route.stops && selectedBus.route.stops.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        {selectedBus.route.stops.length} stops
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedBus.route.stops.map((stop, index) => (
                          <span key={stop._id || index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {stop.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Route Legend */}
                  <div className="mt-3 pt-2 border-t border-muted">
                    <div className="text-xs font-medium text-muted-foreground mb-2">MAP LEGEND</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                        <span>Actual road route</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-orange-400 rounded border-dashed border border-orange-400"></div>
                        <span>Direct route path</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {busLocation && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
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