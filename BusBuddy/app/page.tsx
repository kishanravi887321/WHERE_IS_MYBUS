"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bus, MapPin, Clock, Smartphone, Wifi, Shield } from "lucide-react"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/auth")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center safe-area-inset">
        <div className="text-center animate-fade-in">
          <Bus className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce-gentle" />
          <p className="text-muted-foreground">Loading BusBuddy...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 pwa-safe-area animate-slide-down">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Bus className="h-6 w-6" />
            <h1 className="text-xl font-bold">BusBuddy</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout} className="touch-friendly hover-lift">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 max-w-md mx-auto animate-fade-in">
        <div className="space-y-4">
          <Card className="hover-lift animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5 text-accent" />
                Track Your Bus
              </CardTitle>
              <CardDescription className="text-pretty">Find and track buses in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 text-pretty">
                Welcome to BusBuddy! Your real-time bus tracking companion for tier-2 and tier-3 cities.
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <Button className="w-full touch-friendly hover-lift" onClick={() => router.push("/passenger")}>
                  <MapPin className="h-4 w-4 mr-2" />
                  I'm a Passenger
                </Button>
                <Button
                  variant="outline"
                  className="w-full touch-friendly hover-lift bg-transparent"
                  onClick={() => router.push("/driver")}
                >
                  <Bus className="h-4 w-4 mr-2" />
                  I'm a Driver
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift animate-slide-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Smartphone className="h-5 w-5 text-accent" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-accent" />
                  </div>
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <span>Live ETAs</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center">
                    <Wifi className="h-4 w-4 text-accent" />
                  </div>
                  <span>Offline support</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-accent" />
                  </div>
                  <span>Secure & reliable</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift animate-slide-up" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-balance">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-pretty">Search for buses between your stops</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="text-pretty">Select your bus and start tracking</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="text-pretty">View real-time location on map or timeline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
