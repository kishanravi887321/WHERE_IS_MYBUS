"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { DriverAuth } from "@/components/driver/driver-auth"
import { TripControls } from "@/components/driver/trip-controls"
import { BusInfo } from "@/components/driver/bus-info"
import { DriverConnectionDebug } from "@/components/driver/driver-connection-debug"
import { Button } from "@/components/ui/button"
import { Bus, ArrowLeft, Activity, Users, MapPin, Clock } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"

interface DriverSession {
  busId: string
  token: string
  busInfo: any
}

export default function DriverPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    setIsLoading(false)

    if (!authenticated) {
      router.push("/auth")
    }
  }, [router])

  const handleAuthSuccess = (busId: string, token: string, busInfo: any) => {
    console.log("Auth success received:", { busId, token, busInfo })
    setDriverSession({ busId, token, busInfo })
  }

  const handleTripEnd = () => {
    setDriverSession(null)
  }

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/auth")
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center safe-area-inset">
        <div className="text-center animate-fade-in relative">
          {/* Floating particles */}
          <div className="absolute inset-0 -z-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-300/40 rounded-full animate-float"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + i * 0.5}s`,
                }}
              />
            ))}
          </div>

          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 mx-auto" style={{borderColor: '#212153'}}></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-20 w-20 border-4 border-blue-200 opacity-20 mx-auto"></div>
            <div className="absolute inset-2 animate-ping rounded-full h-16 w-16 border-2 border-blue-300 opacity-30 mx-auto"></div>
          </div>

          <div className="flex items-center justify-center space-x-3 mb-4" style={{color: '#212153'}}>
            <Bus className="h-8 w-8 animate-pulse" style={{color: '#212153'}} />
            <div>
              <p className="text-xl font-bold tracking-wide">{t('driver.loadingDashboard')}</p>
              <p className="text-sm text-gray-600 animate-pulse">{t('driver.initializingControls')}</p>
            </div>
          </div>

          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ 
                  backgroundColor: '#212153',
                  animationDelay: `${i * 0.2}s` 
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Show driver authentication if no active session
  if (!driverSession) {
    return <DriverAuth onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 safe-area-inset relative">
      {/* Enhanced Header with Real-time Clock */}
      <header className="relative">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl"></div>

                <div className="sticky top-0 z-10 border-b border-blue-100 safe-area-top" style={{padding: '16px'}}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={handleBackToHome}
                className="group flex items-center space-x-2 transition-all duration-200"
                style={{color: '#212153'}}
              >
                <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all duration-200 border border-blue-200 group-hover:border-blue-300">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </button>

              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl blur-sm opacity-50" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}></div>
                  <div className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                    <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight" style={{color: '#212153'}}>{t('driver.busCommandCenter')}</h1>
                  <p className="text-xs sm:text-sm text-gray-600">{t('driver.professionalTransitControl')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
              <div className="text-right">
                <div className="text-sm sm:text-lg font-mono font-bold" style={{color: '#212153'}}>{currentTime.toLocaleTimeString()}</div>
                <div className="text-xs text-gray-600">{currentTime.toLocaleDateString()}</div>
              </div>

              <LanguageSelector />

              <Button
                onClick={handleLogout}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg transition-all duration-200 border-0 font-medium text-sm sm:text-base"
              >
                <span className="hidden sm:inline">{t('common.logout')}</span>
                <span className="sm:hidden">{t('common.exit')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-blue-100 p-3 sm:p-4 transition-all duration-200 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 transition-colors">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('driver.systemStatus')}</p>
                <p className="text-sm font-bold" style={{color: '#212153'}}>{t('driver.online')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-blue-100 p-3 sm:p-4 transition-all duration-200 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 transition-colors">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('driver.passengers')}</p>
                <p className="text-sm font-bold" style={{color: '#212153'}}>0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-blue-100 p-3 sm:p-4 transition-all duration-200 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 transition-colors">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('driver.gpsStatus')}</p>
                <p className="text-sm font-bold" style={{color: '#212153'}}>{t('driver.active')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-blue-100 p-3 sm:p-4 transition-all duration-200 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 transition-colors">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('driver.tripTime')}</p>
                <p className="text-sm font-bold" style={{color: '#212153'}}>00:00:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Enhanced Glass Cards */}
      <main className="relative z-10 p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 safe-area-bottom">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Driver Info Card */}
          <div className="xl:col-span-1 bg-white rounded-2xl sm:rounded-3xl border border-blue-100 shadow-2xl p-4 sm:p-6 transition-all duration-200">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold" style={{color: '#212153'}}>
                {t('driver.driverProfile')}
              </h2>
            </div>

            <BusInfo
              busId={driverSession.busId}
              busNumber={driverSession.busInfo?.busNumber || "Unknown"}
              routeName={driverSession.busInfo?.routeName || "Unknown Route"}
              driverName={driverSession.busInfo?.driverName || "Unknown Driver"}
              driverPhone={driverSession.busInfo?.driverPhone || ""}
            />
          </div>

          {/* Trip Controls Card */}
          <div className="xl:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-blue-100 shadow-2xl p-4 sm:p-6 transition-all duration-200">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 rounded-xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold transition-colors" style={{color: '#212153'}}>
                {t('driver.missionControl')}
              </h2>
            </div>

            <TripControls
              busId={driverSession.busId}
              token={driverSession.token}
              driverName={driverSession.busInfo?.driverName || "Unknown Driver"}
              onTripEnd={handleTripEnd}
            />
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl p-6 hover:shadow-3xl transition-all duration-500 group hover:scale-[1.01]">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold transition-colors" style={{color: '#212153'}}>
              {t('driver.systemDiagnostics')}
            </h2>
          </div>

          <DriverConnectionDebug token={driverSession.token} busId={driverSession.busId} />
        </div>
      </main>

      <Toaster />
    </div>
  )
}
