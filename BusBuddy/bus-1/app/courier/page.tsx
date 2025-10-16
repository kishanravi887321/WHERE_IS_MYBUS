"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { BusApiService, type BusSearchResult } from "@/lib/bus-api"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Toaster } from "@/components/ui/toaster"
import { 
  Package, 
  Search, 
  MapPin, 
  ArrowRight, 
  Users, 
  Clock, 
  Route, 
  Send, 
  ArrowLeft, 
  LogOut, 
  Bus,
  Phone,
  Mail,
  User
} from "lucide-react"

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'driver'
  timestamp: Date
}

interface CourierMessage {
  senderName: string
  senderPhone: string
  senderEmail: string
  pickupLocation: string
  deliveryLocation: string
  packageDescription: string
  specialInstructions: string
}

export default function CourierPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [startStop, setStartStop] = useState("")
  const [endStop, setEndStop] = useState("")
  const [searchResults, setSearchResults] = useState<BusSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [selectedBus, setSelectedBus] = useState<BusSearchResult | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [courierMessage, setCourierMessage] = useState<CourierMessage>({
    senderName: "",
    senderPhone: "",
    senderEmail: "",
    pickupLocation: "",
    deliveryLocation: "",
    packageDescription: "",
    specialInstructions: ""
  })

  const router = useRouter()
  const { toast } = useToast()
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

  const handleSearch = async () => {
    if (!startStop.trim() || !endStop.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and delivery locations.",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    try {
      const busApi = BusApiService.getInstance()
      const results = await busApi.searchBusesByRoute(startStop.trim(), endStop.trim())
      setSearchResults(results)

      if (results.length === 0) {
        toast({
          title: "No Buses Found",
          description: `No buses found traveling from ${startStop} to ${endStop}.`,
        })
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search for buses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleBusSelect = (bus: BusSearchResult) => {
    setSelectedBus(bus)
    setCourierMessage(prev => ({
      ...prev,
      pickupLocation: startStop,
      deliveryLocation: endStop
    }))
    
    // Initialize chat with welcome message
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `Hello! I'm the driver of bus ${bus.busId}. How can I help you with your courier request?`,
      sender: 'driver',
      timestamp: new Date()
    }
    setChatMessages([welcomeMessage])
    setCurrentMessage("")
    setIsMessageDialogOpen(true)
  }

  const handleSendChatMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage("")
    setIsSendingMessage(true)

    try {
      // Simulate driver response after a delay (frontend only)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const driverResponses = [
        "Thanks for your message! I'll be happy to help with your courier delivery.",
        "I can assist with your package delivery. Please provide more details about pickup and drop-off locations.",
        "Sure, I can help with that. What's the size and nature of the package?",
        "I'll keep an eye out for your courier request. Please share your contact details.",
        "No problem! I'll coordinate with you for the pickup and delivery.",
        "Received your request. I'll contact you when I'm near the pickup location."
      ]
      
      const randomResponse = driverResponses[Math.floor(Math.random() * driverResponses.length)]
      
      const driverMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'driver',
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, driverMessage])
      
    } catch (error) {
      toast({
        title: "Failed to Send Message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendChatMessage()
    }
  }

  const handleCloseChat = () => {
    setIsMessageDialogOpen(false)
    setChatMessages([])
    setCurrentMessage("")
    setSelectedBus(null)
  }

  const handleLogout = async () => {
    const authService = AuthService.getInstance()
    await authService.logout()
    router.push("/")
  }

  const swapLocations = () => {
    const temp = startStop
    setStartStop(endStop)
    setEndStop(temp)
  }

  if (!mounted || isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="p-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" style={{background: 'linear-gradient(to bottom right, #1b1946, #151339)'}}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold" style={{color: '#1b1946'}}>
                  Courier Tracking Service
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center space-x-2 transition-colors"
                style={{borderColor: '#1b1946', color: '#1b1946'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1b1946'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#1b1946'
                }}
              >
                <LogOut className="h-4 w-4" style={{color: 'inherit'}} />
                <span className="font-medium" style={{color: 'inherit'}}>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Find buses for your courier delivery
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Search for buses traveling on your desired route and send courier details directly to the driver for package delivery.
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Bus Route
            </CardTitle>
            <CardDescription>
              Enter pickup and delivery locations to find available buses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup" className="text-gray-900 font-medium">Pickup Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="pickup"
                    value={startStop}
                    onChange={(e) => setStartStop(e.target.value)}
                    placeholder="Enter pickup location"
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery" className="text-gray-900 font-medium">Delivery Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="delivery"
                    value={endStop}
                    onChange={(e) => setEndStop(e.target.value)}
                    placeholder="Enter delivery location"
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={swapLocations}
                className="h-12 px-6"
              >
                <ArrowRight className="h-4 w-4 mx-2 rotate-90" />
                Swap Locations
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-12 px-8 text-white transition-all duration-300"
                style={{background: `linear-gradient(to right, #1b1946, #141235)`}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, #141235, #0f0f2a)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, #1b1946, #141235)`
                }}
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Buses
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Available Buses ({searchResults.length})
              </CardTitle>
              <CardDescription>
                Select a bus to send your courier details to the driver
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((bus, index) => (
                  <div key={index} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Bus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{bus.busId}</h3>
                          <p className="text-gray-600">{bus.routeName || 'Route information not available'}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              Capacity: {bus.capacity || 'N/A'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              bus.isDriverOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {bus.isDriverOnline ? 'Driver Online' : 'Driver Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleBusSelect(bus)}
                        disabled={!bus.isDriverOnline}
                        className="text-white disabled:opacity-50 transition-all duration-300"
                        style={{background: !bus.isDriverOnline ? '#9ca3af' : `linear-gradient(to right, #1b1946, #141235)`}}
                        onMouseEnter={(e) => {
                          if (bus.isDriverOnline) {
                            e.currentTarget.style.background = `linear-gradient(to right, #141235, #0f0f2a)`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (bus.isDriverOnline) {
                            e.currentTarget.style.background = `linear-gradient(to right, #1b1946, #141235)`
                          }
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Courier Request
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Chat Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={handleCloseChat}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-white p-0 flex flex-col">
          {/* Chat Header */}
          <DialogHeader className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full" style={{backgroundColor: '#f0f0ff'}}>
                <Bus className="h-6 w-6" style={{color: '#1b1946'}} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold" style={{color: '#1b1946'}}>
                  Chat with Driver - Bus {selectedBus?.busId}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  {selectedBus?.driverName} • {selectedBus?.routeName}
                </DialogDescription>
              </div>
              <div className="ml-auto flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] max-h-[400px]">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'text-white shadow-md'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`} style={message.sender === 'user' ? {backgroundColor: '#1b1946'} : {color: '#1b1946'}}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-white opacity-75' : 'text-gray-600'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isSendingMessage && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm" style={{color: '#1b1946'}}>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{backgroundColor: '#1b1946'}}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{backgroundColor: '#1b1946', animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{backgroundColor: '#1b1946', animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs" style={{color: '#1b1946'}}>Driver is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-6 pt-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message about courier details..."
                  className="h-12 resize-none border-gray-300 placeholder:text-gray-500"
                  style={{color: '#1b1946', borderColor: '#d1d5db'}}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1b1946'
                    e.target.style.boxShadow = '0 0 0 1px #1b1946'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                  disabled={isSendingMessage}
                />
              </div>
              <Button
                onClick={handleSendChatMessage}
                disabled={!currentMessage.trim() || isSendingMessage}
                className="h-12 px-6 text-white transition-all duration-300"
                style={{backgroundColor: '#1b1946'}}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#141235'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#1b1946'
                  }
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs" style={{color: '#6b7280'}}>
                Press Enter to send • Route: {startStop} → {endStop}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseChat}
                className="text-xs transition-colors"
                style={{borderColor: '#1b1946', color: '#1b1946'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1b1946'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#1b1946'
                }}
              >
                Close Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}