"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { BusTrackingView } from "@/components/map/bus-tracking-view"
import type { BusSearchResult } from "@/lib/bus-api"
import { BusApiService } from "@/lib/bus-api"
import { Bus, ArrowLeft, LogOut, Share2, QrCode } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"
import { QRCodeComponent } from "@/components/ui/qr-code"

export default function BusTrackingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBus, setSelectedBus] = useState<BusSearchResult | null>(null)
  const [trackingView, setTrackingView] = useState<"map" | "list">("map")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()

  const busId = params.busId as string

  useEffect(() => {
    setMounted(true)
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    
    if (!authenticated) {
      router.push("/auth")
      return
    }

    if (busId) {
      fetchBusById(busId)
    }
  }, [router, busId])

  const fetchBusById = async (busId: string) => {
    try {
      const busApi = BusApiService.getInstance()
      const buses = await busApi.getAllBuses()
      const bus = buses.find(b => b.busId === busId)
      
      if (bus) {
        // Convert Bus to BusSearchResult format
        const busSearchResult: BusSearchResult = {
          busId: bus.busId,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          driverName: bus.driverName,
          capacity: bus.capacity,
          isDriverOnline: bus.isDriverOnline,
          connectedPassengers: bus.connectedPassengers,
          route: bus.route ? {
            startPoint: {
              name: bus.route.stops[0]?.name || '',
              latitude: bus.route.stops[0]?.latitude || 0,
              longitude: bus.route.stops[0]?.longitude || 0
            },
            endPoint: {
              name: bus.route.stops[bus.route.stops.length - 1]?.name || '',
              latitude: bus.route.stops[bus.route.stops.length - 1]?.latitude || 0,
              longitude: bus.route.stops[bus.route.stops.length - 1]?.longitude || 0
            },
            stops: bus.route.stops
          } : undefined
        }
        
        setSelectedBus(busSearchResult)
      } else {
        // Bus not found, redirect to passenger search
        router.push('/passenger')
      }
    } catch (error) {
      console.error("Error fetching bus by ID:", error)
      router.push('/passenger')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSearch = () => {
    router.push('/passenger')
  }

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/auth")
  }

  const scrollToQR = () => {
    const qrSection = document.getElementById('qr-section')
    if (qrSection) {
      qrSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center safe-area-inset relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="relative mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Bus className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{t('passenger.busBuddyPassenger')}</h2>
            <p className="text-blue-200 text-sm sm:text-base">{t('passenger.preparingJourneySearch')}</p>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!selectedBus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 safe-area-inset relative flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4" style={{color: '#212153'}}>Bus Not Found</h2>
          <p className="text-gray-600 mb-6">The requested bus could not be found.</p>
          <Button onClick={handleBackToSearch} style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}>
            Back to Search
          </Button>
        </div>
      </div>
    )
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
                      {t('passenger.tracking')} {selectedBus.busNumber}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {t('passenger.realTimeTracking')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <button
                  onClick={scrollToQR}
                  className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all duration-200 text-xs sm:text-sm border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                >
                  <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('qr.share')}</span>
                </button>
                
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
        <div className="space-y-4 sm:space-y-6">
          {/* Bus Tracking Section */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg border border-gray-200">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-8">
              <div className="relative">
                <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                  <Bus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold" style={{color: '#212153'}}>{t('passenger.liveBusTracking')}</h2>
                <p className="text-sm sm:text-base text-gray-600">{t('passenger.realTimeLocationUpdates')}</p>
              </div>
            </div>
            <BusTrackingView selectedBus={selectedBus} onViewChange={setTrackingView} currentView={trackingView} />
          </div>

          {/* QR Code Section - Always visible below the map */}
          <div id="qr-section" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg border border-gray-200 mb-[75px]">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-8">
              <div className="relative">
                <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                  <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold" style={{color: '#212153'}}>{t('qr.shareTrackingLink')}</h2>
                <p className="text-sm sm:text-base text-gray-600">{t('qr.scanToTrack')}</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              {typeof window !== 'undefined' && (
                <QRCodeComponent
                  value={`${window.location.origin}/passenger/${selectedBus.busId}`}
                  title={`${t('passenger.tracking')} ${selectedBus.busNumber}`}
                  description={t('qr.scanToTrack')}
                  size={200}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:p-6 shadow-2xl safe-area-bottom">
        <div className="flex justify-center gap-2 sm:gap-4 max-w-md mx-auto">
          <button
            onClick={() => setTrackingView("map")}
            className={`group flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-medium transition-all duration-200 ${
              trackingView === "map"
                ? "text-white shadow-lg border-none"
                : "bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 hover:text-gray-900"
            }`}
            style={trackingView === "map" ? {background: 'linear-gradient(to right, #212153, #1e1b4b)'} : {}}
          >
            <div className="flex items-center justify-center">
              <Bus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
              <span className="text-sm sm:text-base">{t('passenger.mapView')}</span>
            </div>
          </button>
          <button
            onClick={() => setTrackingView("list")}
            className={`group flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-medium transition-all duration-200 ${
              trackingView === "list"
                ? "text-white shadow-lg border-none"
                : "bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 hover:text-gray-900"
            }`}
            style={trackingView === "list" ? {background: 'linear-gradient(to right, #212153, #1e1b4b)'} : {}}
          >
            <div className="flex items-center justify-center">
              <Bus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
              <span className="text-sm sm:text-base">{t('passenger.listView')}</span>
            </div>
          </button>
        </div>
      </div>

      <Toaster />
    </div>
  )
}