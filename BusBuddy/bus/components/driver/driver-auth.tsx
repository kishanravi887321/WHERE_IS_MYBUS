"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DriverApiService } from "@/lib/driver-api"
import { useToast } from "@/hooks/use-toast"
import { Bus, Key, Shield, ArrowRight, Sparkles, CheckCircle } from "lucide-react"

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

      toast({
        title: "Bus activated successfully",
        description: `Your driver token: ${result.token}`,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4 relative">
      <div className="relative w-full max-w-md mx-auto">
        {/* Main Card */}
        <div className="relative bg-white rounded-3xl border border-blue-100 shadow-2xl p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-sm opacity-50" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}></div>
                <div className="relative p-4 rounded-2xl shadow-xl" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                  <Bus className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{color: '#212153'}}>Driver Authentication</h1>
            <p className="text-sm leading-relaxed" style={{color: '#666'}}>
              Enter your credentials to access the professional driver dashboard
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleActivateBus} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="busId" className="font-medium text-sm" style={{color: '#212153'}}>
                Bus ID
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200" style={{color: '#212153'}}>
                  <Bus className="h-5 w-5" />
                </div>
                <Input
                  id="busId"
                  type="text"
                  placeholder="Enter your bus ID"
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-blue-50 border-blue-200 rounded-xl placeholder:text-gray-400 focus:bg-white focus:border-blue-300 transition-all duration-300"
                  style={{color: '#212153'}}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey" className="font-medium text-sm" style={{color: '#212153'}}>
                Secret Key
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200" style={{color: '#212153'}}>
                  <Key className="h-5 w-5" />
                </div>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter your secret key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-blue-50 border-blue-200 rounded-xl placeholder:text-gray-400 focus:bg-white focus:border-blue-300 transition-all duration-300"
                  style={{color: '#212153'}}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border-0 font-semibold text-base group"
              style={{backgroundColor: '#212153'}}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Activating Bus...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Activate Bus</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold text-sm" style={{color: '#212153'}}>How it works:</h4>
            </div>
            <ul className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor: '#212153'}}></div>
                <span>Enter your assigned Bus ID and Secret Key</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>System will generate a secure 6-digit driver token</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Use this token to connect and start sharing location</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Passengers can track your bus in real-time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
