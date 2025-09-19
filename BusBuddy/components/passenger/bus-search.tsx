"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, MapPin, ArrowRight, Users } from "lucide-react"
import { BusApiService, type BusSearchResult } from "@/lib/bus-api"
import { useToast } from "@/hooks/use-toast"

interface BusSearchProps {
  onBusSelect: (bus: BusSearchResult) => void
}

export function BusSearch({ onBusSelect }: BusSearchProps) {
  const [startStop, setStartStop] = useState("")
  const [endStop, setEndStop] = useState("")
  const [searchResults, setSearchResults] = useState<BusSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!startStop.trim() || !endStop.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both start and end stops",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const busApi = BusApiService.getInstance()
      const results = await busApi.searchBusesByRoute(startStop.trim(), endStop.trim())
      setSearchResults(results)

      if (results.length === 0) {
        toast({
          title: "No buses found",
          description: `No buses found from ${startStop} to ${endStop}`,
        })
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search for buses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? "text-green-600" : "text-red-600"
  }

  const getStatusText = (isOnline: boolean) => {
    return isOnline ? "Online" : "Offline"
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <Card className="hover-lift animate-scale-in">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Search className="h-5 w-5 text-accent" />
            Find Your Bus
          </CardTitle>
          <CardDescription className="text-pretty">Enter your start and destination stops</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-stop" className="text-sm font-medium">
              From (Start Stop)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="start-stop"
                placeholder="Enter start stop name"
                value={startStop}
                onChange={(e) => setStartStop(e.target.value)}
                className="pl-10 mobile-optimized touch-friendly"
              />
            </div>
          </div>

          <div className="flex justify-center py-2">
            <div className="bg-muted rounded-full p-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-stop" className="text-sm font-medium">
              To (Destination Stop)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="end-stop"
                placeholder="Enter destination stop name"
                value={endStop}
                onChange={(e) => setEndStop(e.target.value)}
                className="pl-10 mobile-optimized touch-friendly"
              />
            </div>
          </div>

          <Button onClick={handleSearch} className="w-full touch-friendly hover-lift" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              "Search Buses"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground text-balance">
            Available Buses ({searchResults.length})
          </h3>

          {searchResults.map((bus, index) => (
            <Card
              key={bus.busId}
              className="cursor-pointer hover-lift transition-all duration-200 animate-scale-in touch-friendly"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onBusSelect(bus)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-bold">
                      {bus.busNumber}
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${bus.isDriverOnline ? "bg-green-500" : "bg-red-500"} animate-pulse-subtle`}
                      ></div>
                      <span className={`text-sm font-medium ${getStatusColor(bus.isDriverOnline)}`}>
                        {getStatusText(bus.isDriverOnline)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {bus.connectedPassengers}/{bus.capacity}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-foreground text-pretty">{bus.routeName}</p>
                  <p className="text-sm text-muted-foreground">Driver: {bus.driverName}</p>

                  {bus.journeyDetails && (
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {bus.journeyDetails.totalStopsInJourney} stops • {bus.journeyDetails.estimatedJourneyTime}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Tap to track this bus</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
