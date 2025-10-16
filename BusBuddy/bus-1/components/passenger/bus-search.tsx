"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, MapPin, ArrowRight, Users, Clock, Route, Zap, ArrowUp, ArrowDown } from "lucide-react"
import { BusApiService, type BusSearchResult } from "@/lib/bus-api"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"

interface BusSearchProps {
  onBusSelect: (bus: BusSearchResult) => void
}

export function BusSearch({ onBusSelect }: BusSearchProps) {
  const [startStop, setStartStop] = useState("")
  const [endStop, setEndStop] = useState("")
  const [searchResults, setSearchResults] = useState<BusSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSearch = async () => {
    if (!startStop.trim() || !endStop.trim()) {
      toast({
        title: t('passenger.missingInformation'),
        description: t('passenger.enterBothStops'),
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
          title: t('passenger.noBusesFound'),
          description: t('passenger.noBusesFoundDesc').replace('{from}', startStop).replace('{to}', endStop),
        })
      }
    } catch (error) {
      toast({
        title: t('passenger.searchFailed'),
        description: t('passenger.searchFailedDesc'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? "text-emerald-400" : "text-red-400"
  }

  const getStatusText = (isOnline: boolean) => {
    return isOnline ? t('passenger.online') : t('passenger.offline')
  }

  const getCapacityColor = (current: number, total: number) => {
    const percentage = (current / total) * 100
    if (percentage < 50) return "text-emerald-400"
    if (percentage < 80) return "text-amber-400"
    return "text-red-400"
  }

  const swapStops = () => {
    const temp = startStop
    setStartStop(endStop)
    setEndStop(temp)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Search Form */}
      <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="start-stop" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
              <div className="p-1 sm:p-1.5 rounded-lg" style={{backgroundColor: '#059669', opacity: 0.1}}>
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" style={{color: '#059669'}} />
              </div>
              <span className="text-sm sm:text-base">{t('passenger.fromStartStop')}</span>
            </Label>
            <div className="relative group">
              <Input
                id="start-stop"
                placeholder={t('passenger.enterStartStop')}
                value={startStop}
                onChange={(e) => setStartStop(e.target.value)}
                className="relative bg-white border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 sm:h-12 text-base sm:text-lg transition-all duration-300"
                style={{color: '#212153'}}
              />
            </div>
          </div>

          <div className="flex justify-center py-1 sm:py-2">
            <button
              onClick={swapStops}
              className="relative group p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
              style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}
            >
              <div className="flex flex-col items-center justify-center space-y-0.5">
                <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="end-stop" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
              <div className="p-1 sm:p-1.5 rounded-lg" style={{backgroundColor: '#ef4444', opacity: 0.1}}>
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" style={{color: '#ef4444'}} />
              </div>
              <span className="text-sm sm:text-base">{t('passenger.toDestinationStop')}</span>
            </Label>
            <div className="relative group">
              <Input
                id="end-stop"
                placeholder={t('passenger.enterDestinationStop')}
                value={endStop}
                onChange={(e) => setEndStop(e.target.value)}
                className="relative bg-white border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 sm:h-12 text-base sm:text-lg transition-all duration-300"
                style={{color: '#212153'}}
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            className="w-full h-12 sm:h-14 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 text-base sm:text-lg group relative overflow-hidden"
            disabled={isLoading}
            style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                <span className="text-sm sm:text-base">{t('passenger.searchingRoutes')}</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm sm:text-base">{t('passenger.findMyBus')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2 sm:space-x-3 mt-6">
            <div className="relative">
              <div className="p-1.5 sm:p-2 rounded-lg shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                <Route className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold" style={{color: '#212153'}}>{t('passenger.availableRoutes').replace('{count}', searchResults.length.toString())}</h3>
          </div>

          <div className="grid gap-3 sm:gap-4">
            {searchResults.map((bus, index) => (
              <div
                key={bus.busId}
                className="group cursor-pointer transition-all duration-300"
                onClick={() => onBusSelect(bus)}
              >
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <div className="px-3 sm:px-4 py-1 sm:py-2 rounded-xl shadow-lg" style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}>
                            <span className="text-white font-bold text-sm sm:text-lg">{bus.busNumber}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${bus.isDriverOnline ? "bg-emerald-500" : "bg-red-500"}`}
                            ></div>
                            {bus.isDriverOnline && (
                              <div className="absolute inset-0 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                            )}
                          </div>
                          <span className={`font-medium text-xs sm:text-sm truncate`} style={{color: bus.isDriverOnline ? '#059669' : '#ef4444'}}>
                            {getStatusText(bus.isDriverOnline)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 flex-shrink-0">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                        <span className={`font-bold text-xs sm:text-sm`} style={{color: bus.connectedPassengers / bus.capacity < 0.5 ? '#059669' : bus.connectedPassengers / bus.capacity < 0.8 ? '#f59e0b' : '#ef4444'}}>
                          {bus.connectedPassengers}/{bus.capacity}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="font-bold text-sm sm:text-lg transition-colors duration-300 leading-tight" style={{color: '#212153'}}>
                        {bus.routeName}
                      </h4>

                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="p-0.5 sm:p-1 rounded" style={{backgroundColor: '#212153', opacity: 0.1}}>
                          <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{color: '#212153'}} />
                        </div>
                        <span className="text-xs sm:text-sm truncate">{t('passenger.driver')}: {bus.driverName}</span>
                      </div>

                      <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{color: '#059669'}} />
                          <span>
                            {bus.route?.stops?.length || bus.journeyDetails?.totalStopsInJourney || 0} {t('passenger.stops')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{color: '#f59e0b'}} />
                          <span className="truncate">
                            {bus.journeyDetails?.estimatedJourneyTime || 
                              `${Math.floor(Math.random() * (180 - 45) + 45)} mins`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 flex items-center justify-between">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4" style={{color: '#f59e0b'}} />
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">{t('passenger.tapToTrackLive')}</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 transition-colors duration-300" style={{color: '#212153'}}>
                        <span className="text-xs sm:text-sm font-medium">{t('passenger.trackBus')}</span>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
