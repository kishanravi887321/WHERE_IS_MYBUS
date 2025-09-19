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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  // Create route from journey details as fallback
  const createJourneyRoute = (journeyDetails: any) => {
    if (!mapInstanceRef.current) return
    
    const map = mapInstanceRef.current
    const L = window.L
    
    console.log('Creating route from journey details:', journeyDetails)
    
    try {
      // Clear existing route markers and layers
      routeMarkersRef.current.forEach((marker: any) => {
        map.removeLayer(marker)
      })
      routeMarkersRef.current = []

      if (busRouteLayerRef.current) {
        map.removeLayer(busRouteLayerRef.current)
      }

      const waypoints: any[] = []
      const markers: any[] = []

      // Add from stop
      if (journeyDetails.fromStop) {
        waypoints.push([journeyDetails.fromStop.latitude, journeyDetails.fromStop.longitude])
        
        const fromMarker = L.marker([journeyDetails.fromStop.latitude, journeyDetails.fromStop.longitude], {
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

        fromMarker.bindPopup(`
          <div style="text-align: center; min-width: 150px;">
            <strong>🚏 From Stop</strong><br>
            <span style="color: #22c55e; font-weight: bold;">${journeyDetails.fromStop.name}</span>
          </div>
        `)

        markers.push(fromMarker)
      }

      // Add intermediate stops
      if (journeyDetails.stopsInBetween && journeyDetails.stopsInBetween.length > 0) {
        journeyDetails.stopsInBetween.forEach((stop: any, index: number) => {
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
                ">${index + 1}</div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            })
          }).addTo(map)

          stopMarker.bindPopup(`
            <div style="text-align: center; min-width: 120px;">
              <strong>🚌 Stop ${index + 1}</strong><br>
              <span style="color: #3b82f6; font-weight: bold;">${stop.name}</span>
            </div>
          `)

          markers.push(stopMarker)
        })
      }

      // Add to stop
      if (journeyDetails.toStop) {
        waypoints.push([journeyDetails.toStop.latitude, journeyDetails.toStop.longitude])
        
        const toMarker = L.marker([journeyDetails.toStop.latitude, journeyDetails.toStop.longitude], {
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

        toMarker.bindPopup(`
          <div style="text-align: center; min-width: 150px;">
            <strong>🏁 To Stop</strong><br>
            <span style="color: #ef4444; font-weight: bold;">${journeyDetails.toStop.name}</span>
          </div>
        `)

        markers.push(toMarker)
      }

      // Store markers for cleanup
      routeMarkersRef.current = markers

      // Create route line
      if (waypoints.length > 1) {
        busRouteLayerRef.current = L.polyline(waypoints, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8
        }).addTo(map)

        busRouteLayerRef.current.bindPopup(`
          <div style="text-align: center;">
            <strong>🛣️ Journey Route</strong><br>
            <small>${journeyDetails.fromStop.name} → ${journeyDetails.toStop.name}</small><br>
            <small>⏱️ ${journeyDetails.estimatedJourneyTime}</small>
          </div>
        `)
      }

      // Fit map to show the route
      if (markers.length > 0) {
        try {
          const group = new L.featureGroup(markers)
          const bounds = group.getBounds()
          if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1))
          } else {
            console.warn('Invalid bounds, centering on first marker')
            if (markers[0]) {
              map.setView(markers[0].getLatLng(), 13)
            }
          }
        } catch (error) {
          console.error('Error fitting bounds:', error)
          // Fallback to default view
          map.setView([28.6139, 77.2090], 12)
        }
      }

      console.log('Journey route created successfully')
    } catch (error) {
      console.error('Error creating journey route:', error)
    }
  }

  const centerOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ latitude, longitude })
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 16)
            
            if (userMarkerRef.current) {
              mapInstanceRef.current.removeLayer(userMarkerRef.current)
            }
            
            userMarkerRef.current = window.L.marker([latitude, longitude], {
              icon: window.L.divIcon({
                className: 'user-location-marker',
                html: `
                  <div style="
                    background-color: #4ade80;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 10px rgba(74, 222, 128, 0.8);
                  "></div>
                `,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              })
            }).addTo(mapInstanceRef.current)
            
            userMarkerRef.current.bindPopup("📍 Your Location")
            
            onLocationUpdate?.({ latitude, longitude })
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          setMapError('Unable to get your location. Please enable location services.')
        }
      )
    } else {
      setMapError('Geolocation is not supported by this browser.')
    }
  }

  const addRouteToMap = () => {
    if (!mapInstanceRef.current || !selectedBus) return

    const L = window.L
    const map = mapInstanceRef.current

    console.log('Selected bus data:', selectedBus)
    console.log('Route data available:', selectedBus.route)

    // Clear existing route
    if (routeControlRef.current) {
      map.removeControl(routeControlRef.current)
      routeControlRef.current = null
    }

    // Clear existing markers
    routeMarkersRef.current.forEach((marker: any) => {
      map.removeLayer(marker)
    })
    routeMarkersRef.current = []

    if (busRouteLayerRef.current) {
      map.removeLayer(busRouteLayerRef.current)
      busRouteLayerRef.current = null
    }

    try {
      // Method 1: Try using bus route data if available
      if (selectedBus.route && selectedBus.route.startPoint && selectedBus.route.endPoint) {
        console.log('Using bus route data:', selectedBus.route)
        
        const startLatLng = [selectedBus.route.startPoint.latitude, selectedBus.route.startPoint.longitude]
        const endLatLng = [selectedBus.route.endPoint.latitude, selectedBus.route.endPoint.longitude]
        
        console.log('Start point:', startLatLng)
        console.log('End point:', endLatLng)

        // Create waypoints array including stops
        const waypoints = [L.latLng(startLatLng[0], startLatLng[1])]
        
        if (selectedBus.route.stops && selectedBus.route.stops.length > 0) {
          // Sort stops by order if available
          const sortedStops = selectedBus.route.stops.sort((a: any, b: any) => {
            if (a.order && b.order) return a.order - b.order
            return 0
          })
          
          sortedStops.forEach((stop: any) => {
            if (stop.latitude && stop.longitude) {
              waypoints.push(L.latLng(stop.latitude, stop.longitude))
            }
          })
        }
        
        waypoints.push(L.latLng(endLatLng[0], endLatLng[1]))
        
        console.log('Creating route with waypoints:', waypoints)

        // Try OSRM routing
        try {
          routeControlRef.current = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            addWaypoints: false,
            createMarker: function(i: number, waypoint: any) {
              const isStart = i === 0
              const isEnd = i === waypoints.length - 1
              
              return L.marker(waypoint.latLng, {
                icon: L.divIcon({
                  className: isStart ? 'route-marker start-marker' : isEnd ? 'route-marker end-marker' : 'route-marker stop-marker',
                  html: `
                    <div style="
                      background-color: ${isStart ? '#22c55e' : isEnd ? '#ef4444' : '#3b82f6'};
                      width: ${isStart || isEnd ? '20px' : '16px'};
                      height: ${isStart || isEnd ? '20px' : '16px'};
                      border-radius: 50%;
                      border: ${isStart || isEnd ? '3px' : '2px'} solid white;
                      box-shadow: 0 0 ${isStart || isEnd ? '10px' : '8px'} rgba(${isStart ? '34, 197, 94' : isEnd ? '239, 68, 68' : '59, 130, 246'}, 0.6);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: ${isStart || isEnd ? '10px' : '8px'};
                      color: white;
                      font-weight: bold;
                    ">${isStart ? '🚏' : isEnd ? '🏁' : i}</div>
                  `,
                  iconSize: [isStart || isEnd ? 26 : 20, isStart || isEnd ? 26 : 20],
                  iconAnchor: [isStart || isEnd ? 13 : 10, isStart || isEnd ? 13 : 10]
                })
              })
            },
            lineOptions: {
              styles: [
                { color: '#3b82f6', weight: 6, opacity: 0.8 },
                { color: '#1e40af', weight: 4, opacity: 1 }
              ]
            },
            show: false,
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            })
          }).addTo(map)

          // Listen for route found
          routeControlRef.current.on('routesfound', function(e: any) {
            console.log('OSRM route found:', e.routes)
            const route = e.routes[0]
            console.log('Route summary:', route.summary)
            
            // Fit bounds to show the entire route
            try {
              const bounds = L.latLngBounds(waypoints)
              if (bounds.isValid()) {
                map.fitBounds(bounds.pad(0.1))
              } else {
                console.warn('Invalid route bounds, using default view')
                map.setView([28.6139, 77.2090], 12)
              }
            } catch (error) {
              console.error('Error fitting route bounds:', error)
              map.setView([28.6139, 77.2090], 12)
            }
          })

          // Listen for errors
          routeControlRef.current.on('routingerror', function(e: any) {
            console.error('OSRM routing error:', e)
            // Fallback to simple line
            createFallbackRoute(waypoints, map, L)
          })

          console.log('OSRM routing control added to map')
          
        } catch (routingError) {
          console.error('Error creating OSRM route:', routingError)
          // Fallback to simple line
          createFallbackRoute(waypoints, map, L)
        }
        
      } else {
        console.log('No route data available, trying journey details...')
        
        // Method 2: Check if it's journey details format
        if (selectedBus.journeyDetails) {
          console.log('Creating route from journey details')
          createJourneyRoute(selectedBus.journeyDetails)
        } else {
          console.log('No route information available for this bus')
        }
      }
      
    } catch (error) {
      console.error('Error adding route to map:', error)
      setMapError('Failed to add route to map. Please try again.')
    }
  }

  // Fallback route creation
  const createFallbackRoute = (waypoints: any[], map: any, L: any) => {
    console.log('Creating fallback route with simple line')
    
    try {
      // Create simple polyline
      const latLngs = waypoints.map((wp: any) => [wp.lat, wp.lng])
      
      busRouteLayerRef.current = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '5, 5'
      }).addTo(map)

      // Add markers manually
      waypoints.forEach((waypoint: any, i: number) => {
        const isStart = i === 0
        const isEnd = i === waypoints.length - 1
        
        const marker = L.marker([waypoint.lat, waypoint.lng], {
          icon: L.divIcon({
            className: isStart ? 'route-marker start-marker' : isEnd ? 'route-marker end-marker' : 'route-marker stop-marker',
            html: `
              <div style="
                background-color: ${isStart ? '#22c55e' : isEnd ? '#ef4444' : '#3b82f6'};
                width: ${isStart || isEnd ? '20px' : '16px'};
                height: ${isStart || isEnd ? '20px' : '16px'};
                border-radius: 50%;
                border: ${isStart || isEnd ? '3px' : '2px'} solid white;
                box-shadow: 0 0 ${isStart || isEnd ? '10px' : '8px'} rgba(${isStart ? '34, 197, 94' : isEnd ? '239, 68, 68' : '59, 130, 246'}, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${isStart || isEnd ? '10px' : '8px'};
                color: white;
                font-weight: bold;
              ">${isStart ? '🚏' : isEnd ? '🏁' : i}</div>
            `,
            iconSize: [isStart || isEnd ? 26 : 20, isStart || isEnd ? 26 : 20],
            iconAnchor: [isStart || isEnd ? 13 : 10, isStart || isEnd ? 13 : 10]
          })
        }).addTo(map)

        marker.bindPopup(isStart ? 'Start Point' : isEnd ? 'End Point' : `Stop ${i}`)
        routeMarkersRef.current.push(marker)
      })

      // Fit bounds
      try {
        const bounds = L.latLngBounds(waypoints)
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1))
        } else {
          console.warn('Invalid fallback bounds, using default view')
          map.setView([28.6139, 77.2090], 12)
        }
      } catch (error) {
        console.error('Error fitting fallback bounds:', error)
        map.setView([28.6139, 77.2090], 12)
      }
      
      console.log('Fallback route created successfully')
      
    } catch (error) {
      console.error('Error creating fallback route:', error)
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      const L = window.L
      
      // Create map with ESRI tiles (more reliable)
      const map = L.map(mapRef.current, {
        center: [28.6139, 77.2090], // Delhi coordinates
        zoom: 12,
        zoomControl: true,
        attributionControl: true
      })

      // ESRI World Street Map (more reliable than OpenStreetMap)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ',
        maxZoom: 19
      }).addTo(map)

      mapInstanceRef.current = map
      setIsMapLoaded(true)
      setMapError(null)

      console.log('Map initialized successfully')

    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('Failed to initialize map. Please refresh the page.')
    }
  }

  const loadMapResources = () => {
    if (window.L) {
      initializeMap()
      return
    }

    // Primary CDN - Leaflet
    const leafletCSS = document.createElement('link')
    leafletCSS.rel = 'stylesheet'
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    leafletCSS.crossOrigin = ''

    const leafletJS = document.createElement('script')
    leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    leafletJS.crossOrigin = ''

    // Routing Machine
    const routingCSS = document.createElement('link')
    routingCSS.rel = 'stylesheet'
    routingCSS.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css'

    const routingJS = document.createElement('script')
    routingJS.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'

    let loadedCount = 0
    const totalToLoad = 4

    const onResourceLoad = () => {
      loadedCount++
      if (loadedCount === totalToLoad && window.L) {
        initializeMap()
      }
    }

    const onResourceError = () => {
      console.error('Failed to load map resources')
      setMapError('Failed to load map resources. Please check your internet connection.')
    }

    leafletCSS.onload = onResourceLoad
    leafletCSS.onerror = onResourceError
    leafletJS.onload = onResourceLoad
    leafletJS.onerror = onResourceError
    routingCSS.onload = onResourceLoad
    routingCSS.onerror = onResourceError
    routingJS.onload = onResourceLoad
    routingJS.onerror = onResourceError

    document.head.appendChild(leafletCSS)
    document.head.appendChild(leafletJS)
    document.head.appendChild(routingCSS)
    document.head.appendChild(routingJS)
  }

  // Update bus marker when bus location changes
  useEffect(() => {
    if (busLocation && mapInstanceRef.current && isMapLoaded) {
      const L = window.L
      const map = mapInstanceRef.current

      if (busMarkerRef.current) {
        map.removeLayer(busMarkerRef.current)
      }

      busMarkerRef.current = L.marker([busLocation.latitude, busLocation.longitude], {
        icon: L.divIcon({
          className: 'bus-marker',
          html: `
            <div style="
              background-color: #f59e0b;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 15px rgba(245, 158, 11, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              transform: rotate(${busLocation.heading || 0}deg);
            ">🚌</div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(map)

      busMarkerRef.current.bindPopup(`
        <div style="text-align: center; min-width: 200px;">
          <strong>🚌 ${selectedBus?.busNumber || 'Bus'}</strong><br>
          <small>Speed: ${busLocation.speed || 0} km/h</small><br>
          <small>Last Updated: ${new Date(busLocation.lastUpdated).toLocaleTimeString()}</small>
        </div>
      `)
    }
  }, [busLocation, isMapLoaded, selectedBus])

  // Add route when selected bus changes
  useEffect(() => {
    if (selectedBus && isMapLoaded) {
      console.log('Selected bus changed, adding route:', selectedBus)
      addRouteToMap()
    }
  }, [selectedBus, isMapLoaded])

  // Initialize map on component mount
  useEffect(() => {
    loadMapResources()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Test route creation function
  const testRouteCreation = () => {
    console.log('Testing route creation with current bus data...')
    if (selectedBus) {
      console.log('Selected bus for testing:', selectedBus)
      addRouteToMap()
    } else {
      console.log('No bus selected for testing')
    }
  }

  return (
    <div className="w-full h-full relative">
      <Card className="w-full h-full border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0 h-full relative">
          {/* Map Container */}
          <div 
            ref={mapRef} 
            className="w-full h-[70vh] md:h-[80vh] bg-gray-100 relative"
            style={{ minHeight: '500px' }}
          />
          
          {/* Error Message */}
          {mapError && (
            <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-[1000]">
              <strong>Error:</strong> {mapError}
            </div>
          )}
          
          {/* Loading Indicator */}
          {!isMapLoaded && !mapError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-[1000]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {/* Control Panel */}
          <div className="absolute top-4 right-4 z-[1000] space-y-2">
            <Button
              onClick={centerOnUser}
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white shadow-lg"
              title="Center on your location"
            >
              <Navigation className="h-4 w-4" />
            </Button>
            
            {selectedBus && (
              <Button
                onClick={testRouteCreation}
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white shadow-lg"
                title="Test route creation"
              >
                <Zap className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Bus Info Panel */}
          {selectedBus && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg z-[1000]">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    Bus {selectedBus.busNumber}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {selectedBus.journeyDetails?.fromStop?.name || selectedBus.route?.startPoint?.name || 'Route'} → {selectedBus.journeyDetails?.toStop?.name || selectedBus.route?.endPoint?.name || 'Destination'}
                  </p>
                  {selectedBus.journeyDetails?.estimatedJourneyTime && (
                    <p className="text-xs text-gray-500">
                      ⏱️ {selectedBus.journeyDetails.estimatedJourneyTime}
                    </p>
                  )}
                </div>
                {busLocation && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Live</p>
                    <p className="text-xs text-gray-500">{busLocation.speed || 0} km/h</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}