"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bus, ArrowLeft, LogOut, Users, Clock, Route, Zap, ArrowRight, MapPin } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"

interface BusResult {
  busId: string
  busNumber: string
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
    fullRoute: string[]
    stops: Array<{
      name: string
      latitude: number
      longitude: number
      order: number
      _id: string
    }>
  }
  driverName: string
  driverPhone: string
  capacity: number
  isActive: any // Can be boolean, string, or number from API
  matchQuality: string
  matchScore: number
}

export default function SearchResultsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [buses, setBuses] = useState<BusResult[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const source = searchParams.get('source')
  const destination = searchParams.get('destination')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    
    if (!authenticated) {
      router.push("/auth")
      return
    }

    // Get buses from URL params (passed as JSON string)
    const busesParam = searchParams.get('buses')
    if (busesParam) {
      try {
        const parsedBuses = JSON.parse(decodeURIComponent(busesParam))
        console.log("Parsed buses data:", parsedBuses) // Debug log
        
        // Debug: Log isActive status for each bus
        parsedBuses.forEach((bus: any, index: number) => {
          console.log(`Bus ${index + 1} (${bus.busNumber}): isActive = ${bus.isActive}, type = ${typeof bus.isActive}`)
          const active = bus.isActive === true || bus.isActive === 'true' || String(bus.isActive) === '1'
          console.log(`  -> Computed active status: ${active}`)
          console.log(`  -> Status text would be: ${active ? 'Online' : 'Offline'}`)
        })
        
        setBuses(parsedBuses)
      } catch (error) {
        console.error("Error parsing buses data:", error)
        console.error("Raw buses param:", busesParam)
      }
    }
    
    setIsLoading(false)
  }, [mounted, router, searchParams])

  const handleBackToSearch = () => {
    router.push('/passenger')
  }

  const handleBusSelect = (bus: BusResult) => {
    router.push(`/passenger/${bus.busId}`)
  }

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/auth")
  }

  const getStatusColor = (isActive: any) => {
    // Handle both boolean and string values from API
    const active = isActive === true || isActive === 'true' || String(isActive) === '1'
    return active ? '#059669' : '#ef4444'
  }

  const getStatusText = (isActive: any) => {
    // Handle both boolean and string values from API
    const active = isActive === true || isActive === 'true' || String(isActive) === '1'
    return active ? t('passenger.online') : t('passenger.offline')
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#059669'
      case 'good': return '#10b981'  
      case 'fair': return '#f59e0b'
      case 'poor': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t('passenger.busBuddyPassenger')}</h2>
          <p className="text-gray-600">{t('passenger.loadingResults')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 safe-area-inset relative">
      <header className="relative z-10">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="p-4 pwa-header safe-area-top" style={{padding: '16px'}}>
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={handleBackToSearch}
                  className="group flex items-center transition-all duration-200"
                  style={{color: '#212153'}}
                >
                  <div className="p-2 sm:p-3 rounded-xl bg-white shadow-md group-hover:shadow-lg transition-all duration-200 border border-gray-200">
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </button>

                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="relative">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                      <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{color: '#212153'}}>
                      {t('passenger.searchResults')}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {source && destination ? `${source} → ${destination}` : t('passenger.availableBuses')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <LanguageSelector />
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 border-red-500 text-red-600 hover:bg-red-50 rounded-xl sm:rounded-2xl font-medium bg-transparent text-xs sm:text-sm"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('common.logout')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 p-3 sm:p-6 max-w-7xl mx-auto pb-20">
        {buses.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Bus className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{t('chatbot.noBusesAvailable')}</h2>
              <p className="text-gray-600">{t('chatbot.tryDifferentRoute')}</p>
              <Button onClick={handleBackToSearch} className="mt-4">
                {t('passenger.backToSearch')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Results Header */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="relative">
                    <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                      <Route className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold" style={{color: '#212153'}}>
                      {t('chatbot.busesFound').replace('{count}', buses.length.toString())} {buses.length === 1 ? t('chatbot.bus') : t('chatbot.buses')}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                      {source && destination ? `${t('passenger.routeFrom')} ${source} ${t('passenger.routeTo')} ${destination}` : t('passenger.tapBusToTrack')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bus Cards */}
            <div className="grid gap-4 sm:gap-6">
              {buses.map((bus, index) => (
                <div
                  key={bus.busId}
                  className="group cursor-pointer transition-all duration-300"
                  onClick={() => handleBusSelect(bus)}
                >
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}>
                              <span className="text-white font-bold text-lg sm:text-xl">{bus.busNumber}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div
                                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full`}
                                style={{backgroundColor: getStatusColor(bus.isActive)}}
                              ></div>
                              {bus.isActive && (
                                <div className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-ping opacity-75" style={{backgroundColor: getStatusColor(bus.isActive)}}></div>
                              )}
                            </div>
                            <span className="font-medium text-sm sm:text-base truncate" style={{color: getStatusColor(bus.isActive)}}>
                              {getStatusText(bus.isActive)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-200 flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                          <span className="font-bold text-sm sm:text-base" style={{color: '#212153'}}>
                            {bus.capacity}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-bold text-lg sm:text-xl transition-colors duration-300 leading-tight" style={{color: '#212153'}}>
                          {bus.route?.startPoint?.name && bus.route?.endPoint?.name 
                            ? `${bus.route.startPoint.name} → ${bus.route.endPoint.name}`
                            : `Bus ${bus.busNumber} Route`
                          }
                        </h4>

                        {/* Route Information */}
                        {bus.route?.fullRoute && bus.route.fullRoute.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <Route className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Full Route</span>
                            </div>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {bus.route.fullRoute.map((stop, index) => (
                                <span key={index} className="inline-flex items-center">
                                  <span className="text-xs sm:text-sm text-gray-600 bg-white px-2 py-1 rounded-lg border">
                                    {stop}
                                  </span>
                                  {index < bus.route.fullRoute.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <div className="p-1 rounded" style={{backgroundColor: '#212153', opacity: 0.1}}>
                              <Users className="h-4 w-4" style={{color: '#212153'}} />
                            </div>
                            <span className="text-sm truncate">{t('passenger.driver')}: {bus.driverName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-gray-600">
                            <div className="p-1 rounded" style={{backgroundColor: '#f59e0b', opacity: 0.1}}>
                              <Clock className="h-4 w-4" style={{color: '#f59e0b'}} />
                            </div>
                            <span className="text-sm">{t('passenger.phone')}: {bus.driverPhone}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{t('passenger.quality')}:</span>
                            <span 
                              className="font-semibold text-sm px-2 py-1 rounded-lg"
                              style={{
                                backgroundColor: getQualityColor(bus.matchQuality) + '20',
                                color: getQualityColor(bus.matchQuality)
                              }}
                            >
                              {bus.matchQuality} ({bus.matchScore?.toFixed(2) || 'N/A'})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#f59e0b'}} />
                          <span className="text-sm sm:text-base text-gray-600 font-medium">{t('passenger.tapToTrackLive')}</span>
                        </div>
                        <div className="flex items-center space-x-2 transition-colors duration-300" style={{color: '#212153'}}>
                          <span className="text-sm sm:text-base font-medium">{t('passenger.trackBus')}</span>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Toaster />
    </div>
  )
}