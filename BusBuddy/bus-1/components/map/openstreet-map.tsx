"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Zap, Bus, Users, AlertTriangle, Maximize, Minimize } from "lucide-react"
import type { BusSearchResult } from "@/lib/bus-api"
import "./map-styles.css"

// Global declarations for OpenLayers
declare global {
  interface Window {
    ol: any
  }
}

interface OpenStreetMapProps {
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

export function OpenStreetMap({ selectedBus, busLocation, onLocationUpdate }: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const busMarkerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const stopMarkersRef = useRef<any[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLocatingUser, setIsLocatingUser] = useState(false)
  const [isUserLocationActive, setIsUserLocationActive] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Load OpenLayers resources
  const loadMapResources = async () => {
    try {
      if (window.ol && window.ol.Map && window.ol.layer && window.ol.source) {
        console.log('OpenLayers already loaded and verified')
        initializeMap()
        return
      }

      console.log('Loading OpenLayers resources...')

      // Load OpenLayers CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css'
      document.head.appendChild(link)

      // Load OpenLayers JS
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js'
      
      script.onload = () => {
        console.log('OpenLayers loaded successfully')
        // Give a longer delay for the library to fully initialize
        setTimeout(() => {
          if (window.ol && window.ol.Map && window.ol.layer && window.ol.source) {
            console.log('OpenLayers API verified, initializing map...')
            initializeMap()
          } else {
            console.error('OpenLayers API incomplete:', { 
              ol: !!window.ol, 
              Map: !!(window.ol && window.ol.Map),
              layer: !!(window.ol && window.ol.layer),
              source: !!(window.ol && window.ol.source)
            })
            setMapError('OpenLayers library failed to initialize properly')
          }
        }, 500)
      }
      
      script.onerror = (error) => {
        console.error('Failed to load OpenLayers:', error)
        setMapError('Failed to load map resources. Please check your internet connection.')
      }
      
      document.head.appendChild(script)
    } catch (error) {
      console.error('Error loading map resources:', error)
      setMapError('Failed to initialize map resources')
    }
  }

  // Initialize the map
  const initializeMap = () => {
    if (!mapRef.current || !window.ol) {
      console.error('Map container or OpenLayers not available')
      setMapError('Map container not ready')
      return
    }

    try {
      const ol = window.ol
      console.log('Initializing OpenLayers map...')

      // Create map instance
      mapInstanceRef.current = new window.ol.Map({
        target: mapRef.current,
        layers: [
          new window.ol.layer.Tile({
            source: new window.ol.source.OSM({
              url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
          })
        ],
        view: new window.ol.View({
          center: window.ol.proj.fromLonLat([77.2090, 28.6139]), // Default to Delhi
          zoom: 10
        })
      })

      console.log('Map instance created successfully')

      // Add custom controls
      addCustomControls()

      setIsMapLoaded(true)
      setMapError(null)
      console.log('Map loaded successfully')

      // Initialize route if bus is selected
      if (selectedBus) {
        console.log('Creating bus route...')
        createBusRoute()
      }

      // Add user location if available
      getUserLocation()

    } catch (error) {
      console.error('Error initializing map:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setMapError(`Failed to create map: ${errorMessage}`)
    }
  }

  // Add custom controls to map
  const addCustomControls = () => {
    if (!mapInstanceRef.current || !window.ol) return

    const ol = window.ol

    // Zoom controls
    const zoomControl = new ol.control.Zoom({
      className: 'custom-zoom-control'
    })
    mapInstanceRef.current.addControl(zoomControl)
  }

  // Create professional bus route with Google Maps-style rendering
  const createBusRoute = () => {
    if (!mapInstanceRef.current || !selectedBus || !window.ol) return

    const ol = window.ol
    const map = mapInstanceRef.current

    console.log('Creating bus route for:', selectedBus)

    // Clear existing route and markers
    clearRouteAndMarkers()

    // Get route coordinates - using actual route.routeCoordinates or fallback
    const routeCoordinates = generateRouteCoordinates()
    console.log('Generated route coordinates:', routeCoordinates)

    if (routeCoordinates.length > 0) {
      // Sort coordinates by order to ensure proper route sequence
      const sortedCoordinates = routeCoordinates.sort((a, b) => a.order - b.order)
      console.log('Sorted route coordinates:', sortedCoordinates)

      // Create route line with all coordinates for smooth path
      const routePoints = sortedCoordinates.map(coord => 
        ol.proj.fromLonLat([coord.longitude, coord.latitude])
      )

      const routeFeature = new ol.Feature({
        geometry: new ol.geom.LineString(routePoints)
      })

      // Google Maps-style route styling with shadow effect
      const routeShadowStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(30, 64, 175, 0.3)', // Blue shadow
          width: 8,
          lineCap: 'round',
          lineJoin: 'round'
        }),
        zIndex: 1
      })

      const routeStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#1E40AF', // Blue color like Google Maps
          width: 5,
          lineCap: 'round',
          lineJoin: 'round'
        }),
        zIndex: 2
      })

      // Apply both shadow and main style for depth effect
      routeFeature.setStyle([routeShadowStyle, routeStyle])

      // Create route layer
      const routeSource = new ol.source.Vector({
        features: [routeFeature]
      })

      routeLayerRef.current = new ol.layer.Vector({
        source: routeSource,
        zIndex: 2
      })

      map.addLayer(routeLayerRef.current)

      // Add bus stops only (not all route points)
      addBusStops(sortedCoordinates)

      // Fit map to route with proper padding
      const extent = routeSource.getExtent()
      map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: 15,
        duration: 1000 // Smooth animation
      })

      console.log('Route created successfully with', sortedCoordinates.length, 'points')
    } else {
      console.warn('No route coordinates available')
      setMapError('No route data available for this bus')
    }
  }

  // Generate route coordinates using route.routeCoordinates or fallback to stops
  const generateRouteCoordinates = () => {
    // First check if we have custom route coordinates
    if (selectedBus?.route?.routeCoordinates && selectedBus.route.routeCoordinates.length > 0) {
      console.log('Using route.routeCoordinates:', selectedBus.route.routeCoordinates)
      return selectedBus.route.routeCoordinates.map(coord => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
        name: `Route Point ${coord.order}`,
        order: coord.order,
        type: 'route'
      }))
    }

    // Fallback to bus stops if available
    if (selectedBus?.route?.stops && selectedBus.route.stops.length > 0) {
      console.log('Using route stops as coordinates:', selectedBus.route.stops)
      return selectedBus.route.stops.map(stop => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
        name: stop.name,
        order: stop.order,
        type: 'stop'
      }))
    }

    // Use startPoint and endPoint if available
    if (selectedBus?.route?.startPoint && selectedBus?.route?.endPoint) {
      console.log('Using start and end points:', selectedBus.route.startPoint, selectedBus.route.endPoint)
      return [
        {
          latitude: selectedBus.route.startPoint.latitude,
          longitude: selectedBus.route.startPoint.longitude,
          name: selectedBus.route.startPoint.name,
          order: 1,
          type: 'stop'
        },
        {
          latitude: selectedBus.route.endPoint.latitude,
          longitude: selectedBus.route.endPoint.longitude,
          name: selectedBus.route.endPoint.name,
          order: 2,
          type: 'stop'
        }
      ]
    }

    // Mock coordinates for demonstration (replace with actual data)
    console.log('Using fallback mock coordinates')
    return [
      { latitude: 26.1496929, longitude: 73.0466977, name: "Thob", order: 1, type: 'stop' },
      { latitude: 26.1580000, longitude: 73.0500000, name: "Intermediate Point", order: 2, type: 'route' },
      { latitude: 26.1620000, longitude: 73.0520000, name: "Intermediate Point", order: 3, type: 'route' },
      { latitude: 26.1650000, longitude: 73.0600000, name: "Dhaundaara", order: 4, type: 'stop' },
      { latitude: 26.2000000, longitude: 73.1000000, name: "Intermediate Point", order: 5, type: 'route' },
      { latitude: 26.7245449, longitude: 72.9047136, name: "Osian", order: 6, type: 'stop' }
    ]
  }

  // Add professional bus stop markers
  const addBusStops = (coordinates: any[]) => {
    if (!mapInstanceRef.current || !window.ol) return

    const ol = window.ol
    const map = mapInstanceRef.current

    // Filter out only bus stops (not route points) for markers
    const busStops = coordinates.filter(coord => coord.type === 'stop')
    console.log('Adding bus stop markers for:', busStops)

    busStops.forEach((stop, index) => {
      const isStart = index === 0
      const isEnd = index === busStops.length - 1

      // Create stop marker with professional styling
      const stopFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([stop.longitude, stop.latitude])),
        name: stop.name,
        type: isStart ? 'start' : isEnd ? 'end' : 'intermediate'
      })

      // Google Maps-style stop marker styling
      const stopStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: isStart || isEnd ? 12 : 8,
          fill: new ol.style.Fill({
            color: isStart ? '#22C55E' : isEnd ? '#EF4444' : '#3B82F6' // Green start, red end, blue intermediate
          }),
          stroke: new ol.style.Stroke({
            color: '#FFFFFF',
            width: 3
          })
        }),
        text: new ol.style.Text({
          text: isStart ? '🚏' : isEnd ? '🏁' : (index + 1).toString(),
          font: `bold ${isStart || isEnd ? '16px' : '12px'} Arial`,
          fill: new ol.style.Fill({
            color: '#FFFFFF'
          }),
          offsetY: 1
        }),
        zIndex: 10
      })

      stopFeature.setStyle(stopStyle)

      // Create stop layer
      const stopSource = new ol.source.Vector({
        features: [stopFeature]
      })

      const stopLayer = new ol.layer.Vector({
        source: stopSource,
        zIndex: 10
      })

      map.addLayer(stopLayer)
      stopMarkersRef.current.push(stopLayer)

      // Add click handler for stop info popup
      stopFeature.set('stopInfo', {
        name: stop.name,
        type: isStart ? 'Start' : isEnd ? 'End' : 'Intermediate',
        order: stop.order
      })
    })

    // Add map click handler for popups
    map.on('click', (evt: any) => {
      const features = map.getFeaturesAtPixel(evt.pixel)
      if (features && features.length > 0) {
        const feature = features[0]
        const stopInfo = feature.get('stopInfo')
        if (stopInfo) {
          console.log(`Clicked on ${stopInfo.type} stop: ${stopInfo.name}`)
          // You can add popup/tooltip logic here
        }
      }
    })

    console.log(`Added ${busStops.length} bus stop markers to map`)
  }

  // Add live bus marker with enhanced styling and movement
  const addBusMarker = () => {
    if (!mapInstanceRef.current || !busLocation || !window.ol) {
      console.log('Cannot add bus marker - missing requirements:', {
        map: !!mapInstanceRef.current,
        busLocation: !!busLocation,
        ol: !!window.ol
      })
      return
    }

    const ol = window.ol
    const map = mapInstanceRef.current

    console.log('Adding/updating live bus marker at:', busLocation)

    // Always clear existing bus marker first to prevent duplicates
    clearBusMarker()

    try {
      const busFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([busLocation.longitude, busLocation.latitude])),
        type: 'bus',
        busData: {
          id: selectedBus?.busId,
          number: selectedBus?.busNumber,
          speed: busLocation.speed,
          heading: busLocation.heading,
          lastUpdated: busLocation.lastUpdated
        }
      })

      console.log('Created bus feature with coordinates:', [busLocation.longitude, busLocation.latitude])

      // Create rotation transform if heading is available
      const rotation = busLocation.heading ? (busLocation.heading * Math.PI) / 180 : 0

      // Simplified bus marker styling for better visibility
      const busStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 20, // Larger radius for better visibility
          fill: new ol.style.Fill({
            color: '#F59E0B' // Orange color
          }),
          stroke: new ol.style.Stroke({
            color: '#FFFFFF',
            width: 4
          })
        }),
        text: new ol.style.Text({
          text: '🚌',
          font: 'bold 20px Arial',
          offsetY: 1,
          rotation: rotation // Rotate bus icon based on heading
        }),
        zIndex: 50 // Medium z-index (above user, below controls)
      })

      busFeature.setStyle(busStyle)
      console.log('Applied bus style with rotation:', rotation)

      const busSource = new ol.source.Vector({
        features: [busFeature]
      })

      busMarkerRef.current = new ol.layer.Vector({
        source: busSource,
        zIndex: 50 // Medium z-index
      })

      map.addLayer(busMarkerRef.current)
      console.log('Bus marker layer added to map successfully')

      // Center map on bus location if no user interaction recently
      const currentCenter = map.getView().getCenter()
      const busCenter = ol.proj.fromLonLat([busLocation.longitude, busLocation.latitude])
      
      // Only auto-center if map is not already close to bus location
      if (currentCenter) {
        const distance = Math.sqrt(
          Math.pow(currentCenter[0] - busCenter[0], 2) + 
          Math.pow(currentCenter[1] - busCenter[1], 2)
        )
        
        // If distance is large (> 1000 meters in map units), center on bus
        if (distance > 1000) {
          map.getView().animate({
            center: busCenter,
            duration: 1000
          })
          console.log('Auto-centered map on bus location')
        }
      }

    } catch (error) {
      console.error('Error creating bus marker:', error)
    }
  }

  // Clear existing route and markers (but keep user location)
  const clearRouteAndMarkers = () => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear route layer
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }

    // Clear stop markers
    stopMarkersRef.current.forEach(layer => {
      map.removeLayer(layer)
    })
    stopMarkersRef.current = []

    console.log('Cleared route and stop markers')
  }

  // Clear only bus marker
  const clearBusMarker = () => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (busMarkerRef.current) {
      map.removeLayer(busMarkerRef.current)
      busMarkerRef.current = null
      console.log('Cleared bus marker')
    }
  }

  // Clear only user marker
  const clearUserMarker = () => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
      userMarkerRef.current = null
      console.log('Cleared user marker')
    }
  }

  // Get user location automatically
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser')
      setMapError('Geolocation not supported')
      return
    }

    console.log('Requesting user location...')
    setIsLocatingUser(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        console.log('User location obtained:', location)
        setUserLocation(location)
        setIsLocatingUser(false)
        setIsUserLocationActive(true)
        onLocationUpdate?.(location)
        addUserMarker(location)
      },
      (error) => {
        console.warn('Geolocation error:', error.message)
        setIsLocatingUser(false)
        setIsUserLocationActive(false)
        
        let errorMessage = 'Unable to get your location. '
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.'
            break
          default:
            errorMessage += 'An unknown error occurred.'
            break
        }
        
        console.log('Location error:', errorMessage)
        // Show a temporary error message
        setMapError(errorMessage)
        setTimeout(() => setMapError(null), 5000) // Clear error after 5 seconds
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache location for 1 minute
      }
    )
  }

  // Add user location marker with enhanced styling
  const addUserMarker = (location: { latitude: number; longitude: number }) => {
    if (!mapInstanceRef.current || !window.ol) return

    const ol = window.ol
    const map = mapInstanceRef.current

    // Always clear existing user marker first to prevent duplicates
    clearUserMarker()

    console.log('Adding user location marker at:', location)

    const userFeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([location.longitude, location.latitude])),
      type: 'user',
      name: 'Your Location'
    })

    // Enhanced Google Maps-style user location marker with pulsing effect
    const pulseStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 25,
        fill: new ol.style.Fill({
          color: 'rgba(66, 133, 244, 0.1)' // Light blue pulse
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(66, 133, 244, 0.3)',
          width: 2
        })
      }),
      zIndex: 13
    })

    const accuracyStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 18,
        fill: new ol.style.Fill({
          color: 'rgba(66, 133, 244, 0.15)' // Accuracy circle
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(66, 133, 244, 0.4)',
          width: 1
        })
      }),
      zIndex: 14
    })

    const userStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 12,
        fill: new ol.style.Fill({
          color: '#4285F4' // Google blue color
        }),
        stroke: new ol.style.Stroke({
          color: '#FFFFFF',
          width: 4
        })
      }),
      zIndex: 15
    })

    userFeature.setStyle([pulseStyle, accuracyStyle, userStyle])

    const userSource = new ol.source.Vector({
      features: [userFeature]
    })

    userMarkerRef.current = new ol.layer.Vector({
      source: userSource,
      zIndex: 15
    })

    map.addLayer(userMarkerRef.current)

    // Add click handler for user location info
    userFeature.set('userInfo', {
      name: 'Your Current Location',
      type: 'User Location',
      coordinates: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      accuracy: 'High accuracy GPS'
    })

    // Add map click handler for user marker
    map.on('click', (evt: any) => {
      const features = map.getFeaturesAtPixel(evt.pixel)
      if (features && features.length > 0) {
        const feature = features.find((f: any) => f.get('type') === 'user')
        if (feature) {
          const userInfo = feature.get('userInfo')
          console.log('User location clicked:', userInfo)
          setIsUserLocationActive(true)
          // The info panel will show automatically due to state change
        }
      }
    })

    console.log('User location marker added successfully')
  }

  // Center map on user location with enhanced functionality
  const centerOnUser = () => {
    console.log('centerOnUser clicked, current userLocation:', userLocation)
    
    if (userLocation && mapInstanceRef.current && window.ol) {
      const ol = window.ol
      console.log('Centering map on existing user location:', userLocation)
      setIsUserLocationActive(true)
      
      // Animate to user location with smooth zoom
      mapInstanceRef.current.getView().animate({
        center: ol.proj.fromLonLat([userLocation.longitude, userLocation.latitude]),
        zoom: 18, // Closer zoom for better detail
        duration: 1000
      })
      
      // Highlight user marker temporarily if it exists
      if (userMarkerRef.current) {
        console.log('Highlighting user marker')
        const features = userMarkerRef.current.getSource().getFeatures()
        if (features.length > 0) {
          const userFeature = features[0]
          
          // Create highlighted style
          const highlightStyle = new ol.style.Style({
            image: new ol.style.Circle({
              radius: 18,
              fill: new ol.style.Fill({
                color: '#4285F4'
              }),
              stroke: new ol.style.Stroke({
                color: '#FFFFFF',
                width: 6
              })
            }),
            zIndex: 20
          })
          
          userFeature.setStyle(highlightStyle)
          
          // Reset to normal style after 2 seconds
          setTimeout(() => {
            const normalStyles = [
              new ol.style.Style({
                image: new ol.style.Circle({
                  radius: 25,
                  fill: new ol.style.Fill({
                    color: 'rgba(66, 133, 244, 0.1)'
                  }),
                  stroke: new ol.style.Stroke({
                    color: 'rgba(66, 133, 244, 0.3)',
                    width: 2
                  })
                }),
                zIndex: 13
              }),
              new ol.style.Style({
                image: new ol.style.Circle({
                  radius: 18,
                  fill: new ol.style.Fill({
                    color: 'rgba(66, 133, 244, 0.15)'
                  }),
                  stroke: new ol.style.Stroke({
                    color: 'rgba(66, 133, 244, 0.4)',
                    width: 1
                  })
                }),
                zIndex: 14
              }),
              new ol.style.Style({
                image: new ol.style.Circle({
                  radius: 12,
                  fill: new ol.style.Fill({
                    color: '#4285F4'
                  }),
                  stroke: new ol.style.Stroke({
                    color: '#FFFFFF',
                    width: 4
                  })
                }),
                zIndex: 15
              })
            ]
            userFeature.setStyle(normalStyles)
          }, 2000)
        }
      }
    } else {
      // Request location if not available
      console.log('User location not available, requesting new location...')
      setIsLocatingUser(true)
      getUserLocation()
    }
  }

  // Effects
  useEffect(() => {
    loadMapResources()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(null)
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isMapLoaded && selectedBus) {
      console.log('Triggering createBusRoute - Map loaded:', isMapLoaded, 'Selected bus:', selectedBus)
      createBusRoute()
    }
  }, [isMapLoaded, selectedBus])

  // Also trigger when route data changes
  useEffect(() => {
    if (isMapLoaded && selectedBus?.route) {
      console.log('Route data changed, recreating route:', selectedBus.route)
      createBusRoute()
    }
  }, [isMapLoaded, selectedBus?.route])

  useEffect(() => {
    if (isMapLoaded && busLocation) {
      addBusMarker()
    }
  }, [isMapLoaded, busLocation])

  // Track user location continuously
  useEffect(() => {
    if (!isMapLoaded) return

    // Initial location request
    getUserLocation()

    // Set up periodic location updates (every 30 seconds)
    const locationInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            // Only update if location has changed significantly (more than ~10 meters)
            if (!userLocation || 
                Math.abs(newLocation.latitude - userLocation.latitude) > 0.0001 ||
                Math.abs(newLocation.longitude - userLocation.longitude) > 0.0001) {
              console.log('User location updated:', newLocation)
              setUserLocation(newLocation)
              addUserMarker(newLocation)
            }
          },
          (error) => {
            console.warn('Periodic location update failed:', error.message)
          },
          {
            enableHighAccuracy: false, // Use less battery for periodic updates
            timeout: 5000,
            maximumAge: 30000
          }
        )
      }
    }, 30000) // Update every 30 seconds

    return () => {
      clearInterval(locationInterval)
    }
  }, [isMapLoaded, userLocation])

  return (
    <div className={`
      relative transition-all duration-300 ease-in-out
      ${isFullScreen 
        ? 'fixed inset-0 z-[9999] bg-white' 
        : 'w-full h-full'
      }
    `}>
      {/* Map Container - No Card Wrapper */}
      <div 
        ref={mapRef} 
        className={`
          w-full bg-gray-100 relative
          ${isFullScreen 
            ? 'h-screen' 
            : 'h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px]'
          }
        `}
        style={{ minHeight: isFullScreen ? '100vh' : '250px' }}
      />
      
      {/* Error Message */}
      {mapError && (
        <div className="absolute top-4 left-4 right-4 bg-red-100/95 backdrop-blur-sm border border-red-400 text-red-700 px-4 py-3 rounded-lg z-[1000] shadow-lg">
          <strong>Error:</strong> {mapError}
        </div>
      )}
      
      {/* Loading Indicator */}
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-100/95 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading OpenStreetMap...</p>
          </div>
        </div>
      )}

      {/* Top Control Panel */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[1000] flex flex-col space-y-1 sm:space-y-2">
        {/* Fullscreen Toggle Button */}
        <Button
          onClick={() => setIsFullScreen(!isFullScreen)}
          variant="outline"
          size="sm"
          className="bg-white/95 hover:bg-white shadow-lg w-8 h-8 sm:w-10 sm:h-10 p-0 backdrop-blur-sm"
          title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullScreen ? (
            <Minimize className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>

        {/* User Location Button */}
        <Button
          onClick={centerOnUser}
          variant={isUserLocationActive ? "default" : "outline"}
          size="sm"
          className={`
            shadow-lg w-8 h-8 sm:w-10 sm:h-10 p-0 transition-all duration-200 backdrop-blur-sm
            ${isUserLocationActive 
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500' 
              : 'bg-white/95 hover:bg-white'
            }
            ${isLocatingUser ? 'animate-pulse' : ''}
          `}
          title={userLocation ? "Center on your location" : "Find your location"}
          disabled={isLocatingUser}
        >
          {isLocatingUser ? (
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent" />
          ) : (
            <Navigation className={`h-3 w-3 sm:h-4 sm:w-4 ${isUserLocationActive ? 'text-white' : ''}`} />
          )}
        </Button>

        {/* Bus Tracking Button */}
        {selectedBus && busLocation && (
          <Button
            onClick={() => {
              if (mapInstanceRef.current && window.ol) {
                const ol = window.ol
                mapInstanceRef.current.getView().animate({
                  center: ol.proj.fromLonLat([busLocation.longitude, busLocation.latitude]),
                  zoom: 16,
                  duration: 1000
                })
              }
            }}
            variant="outline"
            size="sm"
            className="bg-orange-500/95 hover:bg-orange-600 text-white border-orange-500 shadow-lg w-8 h-8 sm:w-10 sm:h-10 p-0 backdrop-blur-sm"
            title="Center on bus location"
          >
            <Bus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {/* Refresh Route Button */}
        {selectedBus && (
          <Button
            onClick={createBusRoute}
            variant="outline"
            size="sm"
            className="bg-white/95 hover:bg-white shadow-lg w-8 h-8 sm:w-10 sm:h-10 p-0 backdrop-blur-sm"
            title="Refresh route"
          >
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>

      {/* Live Bus Info Panel */}
      {busLocation && selectedBus && (
        <div className={`
          absolute top-2 sm:top-4 left-2 sm:left-4 z-[1000] 
          bg-white/95 backdrop-blur-sm rounded-lg shadow-lg 
          p-2 sm:p-3 max-w-[200px] sm:max-w-[250px]
        `}>
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${busLocation.speed > 0 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
            <div className="text-xs sm:text-sm font-medium text-gray-700">Live Bus</div>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-semibold text-orange-600">{selectedBus.busNumber}</div>
            <div>Speed: {busLocation.speed.toFixed(1)} km/h</div>
            <div>Direction: {busLocation.heading}°</div>
            <div className="text-xs text-gray-400">
              Updated: {new Date(busLocation.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* User Location Info Panel */}
      {userLocation && isUserLocationActive && (
        <div className={`
          absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-[1000] 
          bg-white/95 backdrop-blur-sm rounded-lg shadow-lg 
          p-2 sm:p-3 max-w-[200px] sm:max-w-[250px]
        `}>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="text-xs sm:text-sm font-medium text-gray-700">Your Location</div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
          </div>
          <Button
            onClick={() => setIsUserLocationActive(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-full mt-2 text-xs"
          >
            Hide
          </Button>
        </div>
      )}

      {/* Fullscreen Close Button - Additional close option */}
      {isFullScreen && (
        <div className="absolute top-2 left-2 z-[1001]">
          <Button
            onClick={() => setIsFullScreen(false)}
            variant="outline"
            size="sm"
            className="bg-white/95 hover:bg-white shadow-lg w-8 h-8 sm:w-10 sm:h-10 p-0 backdrop-blur-sm"
            title="Exit fullscreen"
          >
            <Minimize className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}