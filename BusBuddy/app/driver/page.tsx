"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { DriverAuth } from "@/components/driver/driver-auth"
import { TripControls } from "@/components/driver/trip-controls"
import { BusInfo } from "@/components/driver/bus-info"
import { DriverConnectionDebug } from "@/components/driver/driver-connection-debug"
import { Button } from "@/components/ui/button"
import { Bus, ArrowLeft } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

interface DriverSession {
  busId: string
  token: string
  busInfo: any
}

export default function DriverPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null)
  const router = useRouter()

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center safe-area-inset">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mx-auto"></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-blue-200 opacity-20 mx-auto"></div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-white/80">
            <Bus className="h-6 w-6 animate-pulse" />
            <p className="text-lg font-medium">Loading Dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 safe-area-inset">
      {/* Professional Header with Glass Effect */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-xl"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative p-6 sticky top-0 z-10 border-b border-white/10">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="group flex items-center space-x-2 text-white/80 hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <ArrowLeft className="h-5 w-5" />
                </div>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                  <Bus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Driver Dashboard</h1>
                  <p className="text-sm text-blue-200">Professional Transit Control System</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-medium"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Glass Cards */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Info Card */}
          <div className="lg:col-span-1 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Driver Info</h2>
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
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Trip Controls</h2>
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
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Connection Status</h2>
          </div>
          
          <DriverConnectionDebug
            token={driverSession.token}
            busId={driverSession.busId}
          />
        </div>
      </main>

      <Toaster />
    </div>
  )
}
