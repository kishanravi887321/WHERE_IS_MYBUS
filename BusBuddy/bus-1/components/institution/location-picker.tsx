"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface LocationPickerProps {
  onLocationSelect: (locationUrl: string) => void
}

export function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationFetched, setLocationFetched] = useState(false)
  const { t } = useLanguage()

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
        onLocationSelect(locationUrl)
        setLocationFetched(true)
        setIsLoading(false)
      },
      (error) => {
        let errorMessage = t('location.failed')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('location.denied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('location.unavailable')
            break
          case error.TIMEOUT:
            errorMessage = t('location.timeout')
            break
        }
        setError(errorMessage)
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleFetchLocation}
        disabled={isLoading || locationFetched}
        className={`w-full h-12 rounded-xl transition-all duration-200 ${
          locationFetched 
            ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-50" 
            : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
        }`}
        style={locationFetched ? {} : {color: '#212153'}}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('institution.fetchingLocation')}
          </>
        ) : locationFetched ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            {t('institution.locationFetched')}
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4 mr-2" />
            {t('institution.fetchLocation')}
          </>
        )}
      </Button>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}