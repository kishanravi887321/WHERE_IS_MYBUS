"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { Building2, Bus, Users, Route, Settings, LogOut, BarChart3, MapPin, Plus, X } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"

interface BusData {
  _id: string
  ownerEmail: string
  busId: string
  busNumber: string
  routeName: string
  driverName: string
  driverPhone: string
  capacity: number
  route: {
    stops: Array<{
      name: string
      latitude: number
      longitude: number
      order: number
    }>
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface RouteStop {
  name: string
  latitude: number
  longitude: number
  order: number
}

export default function OrganizationDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [buses, setBuses] = useState<BusData[]>([])
  const [isAddBusOpen, setIsAddBusOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()

  // Form state for Add Bus
  const [busForm, setBusForm] = useState({
    ownerEmail: '',
    busId: '',
    secretKey: '',
    busNumber: '',
    routeName: '',
    driverName: '',
    driverPhone: '',
    capacity: '',
    stops: [] as RouteStop[]
  })

  const [currentStop, setCurrentStop] = useState({
    name: '',
    latitude: '',
    longitude: '',
    order: 1
  })

  useEffect(() => {
    setMounted(true)
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    
    if (!authenticated) {
      router.push("/auth")
      return
    }
    
    // Load organization email from localStorage
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('organization-email')
      if (savedEmail) {
        setBusForm(prev => ({
          ...prev,
          ownerEmail: savedEmail
        }))
      }
    }
    
    setIsLoading(false)
  }, [router])

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/auth")
  }

  const handleAddStop = () => {
    if (!currentStop.name || !currentStop.latitude || !currentStop.longitude) {
      toast({
        title: "Missing Information",
        description: "Please fill in all stop details",
        variant: "destructive",
      })
      return
    }

    const newStop: RouteStop = {
      name: currentStop.name,
      latitude: parseFloat(currentStop.latitude),
      longitude: parseFloat(currentStop.longitude),
      order: busForm.stops.length + 1
    }

    setBusForm(prev => ({
      ...prev,
      stops: [...prev.stops, newStop]
    }))

    setCurrentStop({
      name: '',
      latitude: '',
      longitude: '',
      order: busForm.stops.length + 2
    })
  }

  const handleRemoveStop = (index: number) => {
    setBusForm(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((stop, i) => ({
        ...stop,
        order: i + 1
      }))
    }))
  }

  const handleSubmitBus = async () => {
    // Validation
    if (!busForm.ownerEmail || !busForm.busId || !busForm.secretKey || 
        !busForm.busNumber || !busForm.routeName || !busForm.driverName || 
        !busForm.driverPhone || !busForm.capacity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (busForm.stops.length === 0) {
      toast({
        title: "Missing Route Information",
        description: "Please add at least one stop for the route",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerEmail: busForm.ownerEmail,
          busId: busForm.busId,
          secretKey: busForm.secretKey,
          busNumber: busForm.busNumber,
          routeName: busForm.routeName,
          driverName: busForm.driverName,
          driverPhone: busForm.driverPhone,
          capacity: parseInt(busForm.capacity),
          route: {
            stops: busForm.stops
          }
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: data.message || "Bus created successfully",
        })
        
        // Add new bus to the list
        setBuses(prev => [...prev, data.data])
        
        // Reset form and close modal
        setBusForm({
          ownerEmail: '',
          busId: '',
          secretKey: '',
          busNumber: '',
          routeName: '',
          driverName: '',
          driverPhone: '',
          capacity: '',
          stops: []
        })
        setCurrentStop({
          name: '',
          latitude: '',
          longitude: '',
          order: 1
        })
        setIsAddBusOpen(false)
      } else {
        throw new Error(data.message || 'Failed to create bus')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create bus",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center safe-area-inset relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="relative mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{t('organization.dashboard')}</h2>
            <p className="text-blue-200 text-sm sm:text-base">{t('common.loading')}</p>
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
                <div className="relative">
                  <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{color: '#212153'}}>
                    {t('organization.dashboard')}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t('organization.manageNetwork')}
                  </p>
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
        {/* Quick Action Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{color: '#212153'}}>
                Fleet Management
              </h2>
              <p className="text-gray-600">
                Manage your buses, routes, and transportation operations
              </p>
            </div>
            <Button 
              onClick={() => setIsAddBusOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Bus className="h-5 w-5 mr-2" />
              Add New Bus
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Buses</p>
                  <p className="text-3xl font-bold text-blue-600">0</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Bus className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Routes</p>
                  <p className="text-3xl font-bold text-green-600">0</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Route className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Drivers</p>
                  <p className="text-3xl font-bold text-purple-600">0</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buses Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold" style={{color: '#212153'}}>Your Buses</h3>
            <p className="text-gray-600 text-sm mt-1">Manage and monitor your fleet</p>
          </div>
          
          <div className="p-6">
            {buses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bus className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No buses added yet</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first bus to the fleet</p>
                <Button 
                  onClick={() => setIsAddBusOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Bus className="h-4 w-4 mr-2" />
                  Add Your First Bus
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Bus Number</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Route</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Driver</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Capacity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buses.map((bus, index) => (
                      <tr key={bus._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{bus.busNumber}</td>
                        <td className="py-4 px-4 text-gray-600">{bus.routeName}</td>
                        <td className="py-4 px-4 text-gray-600">{bus.driverName}</td>
                        <td className="py-4 px-4 text-gray-600">{bus.capacity}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bus.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {bus.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Toaster />

      {/* Add Bus Dialog */}
      <Dialog open={isAddBusOpen} onOpenChange={setIsAddBusOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Add New Bus
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Fill in the details to add a new bus to your fleet
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <Label htmlFor="ownerEmail" className="text-gray-900 font-medium">Owner Email *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={busForm.ownerEmail}
                  onChange={(e) => setBusForm(prev => ({...prev, ownerEmail: e.target.value}))}
                  placeholder="owner@example.com"
                  className="bg-blue-50 border-blue-200 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Auto-filled from your organization registration
                </p>
              </div>

              <div>
                <Label htmlFor="busId" className="text-gray-900 font-medium">Bus ID *</Label>
                <Input
                  id="busId"
                  value={busForm.busId}
                  onChange={(e) => setBusForm(prev => ({...prev, busId: e.target.value}))}
                  placeholder="BUS001"
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="secretKey" className="text-gray-900 font-medium">Secret Key *</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={busForm.secretKey}
                  onChange={(e) => setBusForm(prev => ({...prev, secretKey: e.target.value}))}
                  placeholder="Enter secret key"
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="busNumber" className="text-gray-900 font-medium">Bus Number *</Label>
                <Input
                  id="busNumber"
                  value={busForm.busNumber}
                  onChange={(e) => setBusForm(prev => ({...prev, busNumber: e.target.value}))}
                  placeholder="RJ14PA1234"
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="routeName" className="text-gray-900 font-medium">Route Name *</Label>
                <Input
                  id="routeName"
                  value={busForm.routeName}
                  onChange={(e) => setBusForm(prev => ({...prev, routeName: e.target.value}))}
                  placeholder="City Center to Airport"
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Driver Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Driver Information</h3>
              
              <div>
                <Label htmlFor="driverName" className="text-gray-900 font-medium">Driver Name *</Label>
                <Input
                  id="driverName"
                  value={busForm.driverName}
                  onChange={(e) => setBusForm(prev => ({...prev, driverName: e.target.value}))}
                  placeholder="John Doe"
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="driverPhone" className="text-gray-900 font-medium">Driver Phone *</Label>
                <Input
                  id="driverPhone"
                  type="tel"
                  value={busForm.driverPhone}
                  onChange={(e) => setBusForm(prev => ({...prev, driverPhone: e.target.value}))}
                  placeholder="9876543210"
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="capacity" className="text-gray-900 font-medium">Bus Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={busForm.capacity}
                  onChange={(e) => setBusForm(prev => ({...prev, capacity: e.target.value}))}
                  placeholder="50"
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Route Stops */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Route Stops</h3>
            
            {/* Add Stop Form */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="font-medium mb-3 text-gray-900">Add Stop</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="stopName" className="text-gray-900 font-medium">Stop Name</Label>
                  <Input
                    id="stopName"
                    value={currentStop.name}
                    onChange={(e) => setCurrentStop(prev => ({...prev, name: e.target.value}))}
                    placeholder="Bus Stop Name"
                    className="text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="latitude" className="text-gray-900 font-medium">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={currentStop.latitude}
                    onChange={(e) => setCurrentStop(prev => ({...prev, latitude: e.target.value}))}
                    placeholder="28.6139"
                    className="text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-gray-900 font-medium">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={currentStop.longitude}
                    onChange={(e) => setCurrentStop(prev => ({...prev, longitude: e.target.value}))}
                    placeholder="77.2090"
                    className="text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddStop} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stop
                  </Button>
                </div>
              </div>
            </div>

            {/* Stops List */}
            {busForm.stops.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Route Stops ({busForm.stops.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {busForm.stops.map((stop, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{stop.order}. {stop.name}</span>
                        <span className="text-gray-600 ml-2 text-sm">
                          ({stop.latitude}, {stop.longitude})
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveStop(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsAddBusOpen(false)}
              disabled={isSubmitting}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitBus}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Bus...
                </>
              ) : (
                <>
                  <Bus className="h-4 w-4 mr-2" />
                  Create Bus
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}