"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { BusSearch } from "@/components/passenger/bus-search"
import { RecentSearches } from "@/components/passenger/recent-searches"
import type { BusSearchResult } from "@/lib/bus-api"
import { Bus, Navigation, Clock, LogOut } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"

export default function PassengerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    setIsLoading(false)

    if (!authenticated) {
      router.push("/auth")
    }
  }, [router])

  const handleBusSelect = (bus: BusSearchResult) => {
    // Navigate to dedicated bus tracking page
    router.push(`/passenger/${bus.busId}`)
    
    // Add to recent searches if available
    if (bus.journeyDetails && (window as any).addRecentSearch) {
      ;(window as any).addRecentSearch(bus.journeyDetails.fromStop.name, bus.journeyDetails.toStop.name)
    }
  }

  const handleRecentSearchSelect = (fromStop: string, toStop: string) => {
    // This would trigger a new search with the selected stops
    console.log("Selected recent search:", fromStop, "to", toStop)
  }

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/auth")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 safe-area-inset relative">
      <header className="relative z-10">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="p-4 pwa-header safe-area-top" style={{padding: '16px'}}>
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="relative">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                      <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{color: '#212153'}}>
                      {t('passenger.findYourBus')}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {t('passenger.smartTransitSearch')}
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
        <div className="space-y-4 sm:space-y-8">
          {/* Enhanced Search Section */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{border: '1px solid #1f1c4c'}}>
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-8">
              <div className="relative">
                <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                  <Navigation className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold" style={{color: '#212153'}}>{t('passenger.smartBusSearch')}</h2>
                <p className="text-sm sm:text-base text-gray-600">{t('passenger.findBusesBetweenStops')}</p>
              </div>
            </div>
            <BusSearch onBusSelect={handleBusSelect} />
          </div>

          {/* Enhanced Recent Searches Section */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg" style={{border: '1px solid #1f1c4c'}}>
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-8">
              <div className="relative">
                <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold" style={{color: '#212153'}}>{t('passenger.recentSearches')}</h2>
                <p className="text-sm sm:text-base text-gray-600">{t('passenger.quickAccessPreviousRoutes')}</p>
              </div>
            </div>
            <RecentSearches onSearchSelect={handleRecentSearchSelect} />
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
}
