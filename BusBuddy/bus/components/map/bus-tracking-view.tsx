"use client"

import { useState } from "react"
import { OpenStreetMap } from "./index"
import { useBusTracking } from "@/hooks/use-socket"
import type { BusSearchResult } from "@/lib/bus-api"
import { Clock, Users, Wifi, WifiOff, Zap, AlertCircle, CheckCircle, ArrowRight, Circle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface BusTrackingViewProps {
  selectedBus: BusSearchResult
  onViewChange: (view: "map" | "list") => void
  currentView: "map" | "list"
}

export function BusTrackingView({ selectedBus, onViewChange, currentView }: BusTrackingViewProps) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const { t, language } = useLanguage()

  console.log("[v0] BusTrackingView rendered with currentView:", currentView)

  const { busLocation, driverStatus, lastUpdate, isConnected } = useBusTracking(selectedBus.busId)

  const busLocationData = busLocation
    ? {
        latitude: busLocation.location.latitude,
        longitude: busLocation.location.longitude,
        speed: busLocation.speed,
        heading: busLocation.heading,
        lastUpdated: busLocation.timestamp,
      }
    : null

  const handleLocationUpdate = (location: { latitude: number; longitude: number }) => {
    setUserLocation(location)
  }

  const getConnectionStatus = () => {
    return isConnected && driverStatus === "online" ? t('passenger.connected') : t('passenger.disconnected')
  }

  const getConnectionColor = () => {
    return isConnected && driverStatus === "online" ? "text-green-600" : "text-red-600"
  }

  const mockStops = [
    { id: 1, name: "Thob", nameHi: "थोब", status: "departed", time: "14:06", type: "start" },
    { id: 2, name: "Bambhuon Ki Dhani", nameHi: "बांभुओं की ढाणी", status: "departed", time: "14:08", type: "intermediate" },
    { id: 3, name: "Dhaundaara", nameHi: "धौंडारा", status: "arriving", time: "Arriving Now", speed: "0 km/h", type: "current" },
    { id: 4, name: "Basni", nameHi: "बासनी", status: "upcoming", time: "6 min", type: "upcoming" },
  ]

  const getStopStatusText = (status: string, time: string, speed?: string, type?: string) => {
    switch (status) {
      case "departed":
        return t('passenger.departed') + (type === "start" ? ` • ${t('passenger.start')}` : "")
      case "arriving":
        return `${t('passenger.arrivingNow')} • ${speed}`
      case "upcoming":
        return time
      default:
        return time
    }
  }

  const getStopTimeText = (status: string, time: string) => {
    return status === "arriving" ? t('passenger.arriving') : time
  }

  const getStopName = (stop: { name: string; nameHi: string }) => {
    return language === 'hi' ? stop.nameHi : stop.name
  }

  // Translation mapping for journey details stops
  const stopNameTranslations: { [key: string]: string } = {
    'Main Station': 'मुख्य स्टेशन',
    'Bus Terminal': 'बस टर्मिनल',
    'City Center': 'शहर केंद्र',
    'Railway Station': 'रेलवे स्टेशन',
    'Hospital': 'अस्पताल',
    'University': 'विश्वविद्यालय',
    'Market': 'बाज़ार',
    'Airport': 'हवाई अड्डा',
    // Add more as needed
  }

  const translateStopName = (stopName: string) => {
    if (language === 'hi' && stopNameTranslations[stopName]) {
      return stopNameTranslations[stopName]
    }
    return stopName
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="relative">
              <div
                className={`relative p-1.5 sm:p-2 lg:p-3 rounded-full shadow-lg ${
                  isConnected && driverStatus === "online"
                    ? "text-white"
                    : "text-white"
                }`}
                style={{
                  background: isConnected && driverStatus === "online" 
                    ? 'linear-gradient(to bottom right, #059669, #10b981)' 
                    : 'linear-gradient(to bottom right, #ef4444, #f87171)'
                }}
              >
                {isConnected && driverStatus === "online" ? (
                  <Wifi className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                ) : (
                  <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                )}
              </div>
            </div>
            <div>
              <div className={`text-xs sm:text-sm lg:text-base font-bold`} style={{color: isConnected && driverStatus === "online" ? '#059669' : '#ef4444'}}>{getConnectionStatus()}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-3 lg:gap-6">
            {busLocationData && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <div className="p-1 sm:p-1.5 lg:p-2 bg-gray-100 rounded-lg">
                  <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" style={{color: '#f59e0b'}} />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm" style={{color: '#212153'}}>{busLocationData.speed.toFixed(0)}</div>
                  <div className="text-gray-600 text-xs">km/h</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <div className="p-1 sm:p-1.5 lg:p-2 bg-gray-100 rounded-lg">
                <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" style={{color: '#059669'}} />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm" style={{color: '#212153'}}>
                  {selectedBus.connectedPassengers}/{selectedBus.capacity}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <div className="p-1 sm:p-2 bg-gray-100 rounded-lg">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" style={{color: '#212153'}} />
              </div>
              <div>
                <div className="font-bold" style={{color: '#212153'}}>{isConnected ? t('passenger.live') : t('passenger.offline')}</div>
              </div>
            </div>
          </div>
        </div>

        {lastUpdate && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{t('passenger.lastUpdate')}: {new Date(lastUpdate).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentView === "map" && (
        <>
          {/* Map Container - Now at the top */}
          <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg border border-gray-200">
            <div className="relative">
              <OpenStreetMap
                selectedBus={selectedBus}
                busLocation={busLocationData || undefined}
                onLocationUpdate={handleLocationUpdate}
              />
              {!isConnected && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center max-w-sm mx-auto shadow-xl">
                    <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 mx-auto mb-2 sm:mb-4" style={{color: '#f59e0b'}} />
                    <h3 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2" style={{color: '#212153'}}>{t('passenger.connectionLost')}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{t('passenger.reconnecting')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Live Telemetry Panel - Now below the map */}
          {busLocationData && isConnected && (
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{color: '#212153'}}>{t('passenger.liveTelemetry')}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{t('passenger.realTimeVehicleData')}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#059669'}}></div>
                    <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75" style={{backgroundColor: '#059669'}}></div>
                  </div>
                  <span className="text-xs font-medium" style={{color: '#059669'}}>{t('passenger.broadcastingLive')}</span>
                </div>
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Speed Card */}
                <div className="group bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 transition-all duration-300">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#f59e0b'}} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg sm:text-xl font-bold transition-colors" style={{color: '#212153'}}>
                        {busLocationData.speed.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-600">{t('passenger.currentSpeed')}</p>
                    </div>
                  </div>
                </div>
                
                {/* Heading Card */}
                <div className="group bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 transition-all duration-300">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg sm:text-xl font-bold transition-colors" style={{color: '#212153'}}>
                        {busLocationData.heading.toFixed(0)}°
                      </p>
                      <p className="text-xs text-gray-600">{t('passenger.compassHeading')}</p>
                    </div>
                  </div>
                </div>
                
                {/* Passengers Card */}
                <div className="group bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 transition-all duration-300">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#059669'}} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg sm:text-xl font-bold transition-colors" style={{color: '#212153'}}>
                        {selectedBus.connectedPassengers}/{selectedBus.capacity}
                      </p>
                      <p className="text-xs text-gray-600">{t('passenger.connectedPassengers')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* GPS Coordinates Section */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#212153'}} />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{color: '#212153'}}>{t('passenger.gpsCoordinates')}</p>
                      <p className="text-xs sm:text-sm font-mono text-gray-700 break-all">
                        {busLocationData.latitude.toFixed(6)}, {busLocationData.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{color: '#212153'}}>{t('passenger.lastUpdated')}</p>
                    <p className="text-xs sm:text-sm font-mono text-gray-700">
                      {new Date(busLocationData.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {currentView === "list" && (
        <div className="space-y-4">
          {/* Bus Timeline Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold" style={{color: '#212153'}}>{t('passenger.busTimeline')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {translateStopName(selectedBus.journeyDetails?.fromStop.name || '')} to {translateStopName(selectedBus.journeyDetails?.toStop.name || '')}
                  </p>
                </div>
              </div>
              <div className="text-white px-3 py-1 rounded-full text-xs font-medium" style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}>{t('passenger.live')}</div>
            </div>
          </div>

          {/* Stops List */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="space-y-4">
              {mockStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Status Icon */}
                    <div className="flex flex-col items-center">
                      {stop.status === "departed" && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" style={{color: '#059669'}} />}
                      {stop.status === "arriving" && <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" style={{color: '#212153'}} />}
                      {stop.status === "upcoming" && <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />}
                      {/* Connecting line */}
                      {index < mockStops.length - 1 && (
                        <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent mt-2"></div>
                      )}
                    </div>

                    {/* Stop Details */}
                    <div>
                      <div className="font-medium text-sm sm:text-base" style={{color: '#212153'}}>{getStopName(stop)}</div>
                      <div
                        className={`text-xs sm:text-sm`}
                        style={{
                          color: stop.status === "departed" ? '#059669' : 
                                 stop.status === "arriving" ? '#212153' : '#9ca3af'
                        }}
                      >
                        {getStopStatusText(stop.status, stop.time, stop.speed, stop.type)}
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">
                    {getStopTimeText(stop.status, stop.time)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-lg border border-gray-200">
          <div className="relative mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto shadow-xl" style={{background: 'linear-gradient(to bottom right, #f59e0b, #f97316)'}}>
              <WifiOff className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2" style={{color: '#212153'}}>{t('passenger.connectingLiveUpdates')}</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            {t('passenger.establishingConnection')}
          </p>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#212153', animationDelay: "0s" }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#212153', animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#212153', animationDelay: "0.2s" }}></div>
            </div>
          </div>
          <div className="mt-4 text-xs sm:text-sm text-gray-500">{t('passenger.stableInternetConnection')}</div>
        </div>
      )}
    </div>
  )
}
