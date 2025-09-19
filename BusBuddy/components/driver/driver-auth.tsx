"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DriverApiService } from "@/lib/driver-api"
import { useToast } from "@/hooks/use-toast"
import { Bus, Key, Shield } from "lucide-react"

interface DriverAuthProps {
  onAuthSuccess: (busId: string, token: string, busInfo: any) => void
}

export function DriverAuth({ onAuthSuccess }: DriverAuthProps) {
  const [busId, setBusId] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleActivateBus = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!busId.trim() || !secretKey.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both Bus ID and Secret Key",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const driverApi = DriverApiService.getInstance()
      const result = await driverApi.activateBus(busId.trim(), secretKey.trim())

      console.log("🔍 Full API Response:", result)
      console.log("🔍 BusInfo from API:", result.busInfo)
      console.log("🔍 BusInfo properties:", {
        busNumber: result.busInfo?.busNumber,
        routeName: result.busInfo?.routeName,
        driverName: result.busInfo?.driverName,
        driverPhone: result.busInfo?.driverPhone,
        capacity: result.busInfo?.capacity
      })

      toast({
        title: "Bus activated successfully",
        description: `Your driver token: ${result.token}`,
      })

      console.log("🔍 Calling onAuthSuccess with:", {
        busId: busId.trim(),
        token: result.token,
        busInfo: result.busInfo
      })

      onAuthSuccess(busId.trim(), result.token, result.busInfo)
    } catch (error: any) {
      toast({
        title: "Activation failed",
        description: error.message || "Failed to activate bus",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bus className="h-8 w-8 text-primary" />
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Driver Authentication</CardTitle>
          <CardDescription>Enter your bus credentials to start your trip</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivateBus} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="busId">Bus ID</Label>
              <div className="relative">
                <Bus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busId"
                  type="text"
                  placeholder="Enter your bus ID"
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter your secret key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Activating Bus..." : "Activate Bus"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">How it works:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Enter your assigned Bus ID and Secret Key</li>
              <li>• System will generate a 6-digit driver token</li>
              <li>• Use this token to connect and start sharing location</li>
              <li>• Passengers can track your bus in real-time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
