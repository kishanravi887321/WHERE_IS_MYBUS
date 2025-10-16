"use client"

import { Badge } from "@/components/ui/badge"
import { Bus, Route, User, Phone, Shield, MapPin } from "lucide-react"

interface BusInfoProps {
  busId: string
  busNumber?: string
  routeName?: string
  driverName: string
  driverPhone?: string
}

export function BusInfo({ busId, busNumber, routeName, driverName, driverPhone }: BusInfoProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bus Details Section */}
      <div className="bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100 p-3 sm:p-4 transition-all duration-200">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 transition-all duration-200">
            <Bus className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold" style={{color: '#212153'}}>Vehicle Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-blue-100 transition-all duration-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Bus ID</p>
              <p className="text-xs sm:text-sm font-mono font-medium" style={{color: '#212153'}}>{busId}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </div>

          {busNumber && (
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-blue-100 transition-all duration-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Bus Number</p>
                <Badge
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 font-medium text-xs sm:text-sm"
                >
                  #{busNumber}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Route Information */}
      {routeName && (
        <div className="bg-purple-50 rounded-xl sm:rounded-2xl border border-purple-100 p-3 sm:p-4 transition-all duration-200">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 transition-all duration-200">
              <Route className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold" style={{color: '#212153'}}>Route Assignment</h3>
          </div>

          <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-purple-100 transition-all duration-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Active Route</p>
              <p className="text-xs sm:text-sm font-semibold" style={{color: '#212153'}}>{routeName}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Driver Profile Section */}
      <div className="bg-green-50 rounded-xl sm:rounded-2xl border border-green-100 p-3 sm:p-4 transition-all duration-200">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 transition-all duration-200">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold" style={{color: '#212153'}}>Driver Profile</h3>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-green-100 transition-all duration-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Driver Name</p>
              <p className="text-xs sm:text-sm font-semibold" style={{color: '#212153'}}>{driverName}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
              {driverName.charAt(0).toUpperCase()}
            </div>
          </div>

          {driverPhone && (
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-green-100 transition-all duration-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Contact Number</p>
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 text-green-600" />
                  <p className="text-sm font-mono" style={{color: '#212153'}}>{driverPhone}</p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center p-3 rounded-xl bg-green-50 border border-green-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-xs text-green-700 font-medium">Driver Authenticated</p>
        </div>
      </div>
    </div>
  )
}
