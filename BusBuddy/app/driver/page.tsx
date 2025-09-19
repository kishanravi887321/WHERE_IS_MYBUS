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
      <div className="min-h-screen bg-background flex items-center justify-center safe-area-inset">
        <div className="text-center animate-fade-in">
          <Bus className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse-subtle" />
          <p className="text-muted-foreground">Loading...</p>
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
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 pwa-safe-area animate-slide-down">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="text-primary-foreground hover:bg-primary-foreground/20 p-1 touch-friendly animate-scale-in"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Bus className="h-6 w-6" />
            <h1 className="text-lg sm:text-xl font-bold text-balance">Driver Dashboard</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout} className="touch-friendly hover-lift">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 max-w-md mx-auto space-y-4 animate-fade-in">
        {/* Debug info */}
        <div className="bg-gray-100 p-2 rounded text-xs">
          <pre>{JSON.stringify(driverSession, null, 2)}</pre>
        </div>
        
        <div className="animate-slide-up">
          <BusInfo
            busId={driverSession.busId}
            busNumber={driverSession.busInfo?.busNumber || "Unknown"}
            routeName={driverSession.busInfo?.routeName || "Unknown Route"}
            driverName={driverSession.busInfo?.driverName || "Unknown Driver"}
            driverPhone={driverSession.busInfo?.driverPhone || ""}
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <TripControls
            busId={driverSession.busId}
            token={driverSession.token}
            driverName={driverSession.busInfo?.driverName || "Unknown Driver"}
            onTripEnd={handleTripEnd}
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
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
