"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Bus, Building2, Mail, Lock, Phone, MapPin, Globe, ArrowLeft, MapIcon } from "lucide-react"
// Update the import path below if the actual file name or path is different, e.g. 'LocationPicker' or with '.tsx' extension
import { LocationPicker } from "@/components/institution/location-picker"
import { CitySearch } from "@/components/institution/city-search"
import { Toaster } from "@/components/ui/toaster"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
]

export default function InstitutionRegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phoneNumber: "",
    city: "",
    state: "",
    website_url: "",
    location_url: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    // Check if user is authenticated
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    
    if (!authenticated) {
      router.push("/auth")
    }
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLocationSelect = (locationUrl: string) => {
    setFormData(prev => ({
      ...prev,
      location_url: locationUrl
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.name || !formData.phoneNumber || !formData.city || !formData.state) {
        toast({
          title: t('institution.missingInfo'),
          description: t('institution.fillRequired'),
          variant: "destructive",
        })
        return
      }

      // Get current user and auth token
      const authService = AuthService.getInstance()
      const currentUser = authService.getCurrentUser()
      const accessToken = authService.getAccessToken()
      
      if (!currentUser || !accessToken) {
        toast({
          title: t('institution.authRequired'),
          description: t('institution.pleaseLogin'),
          variant: "destructive",
        })
        router.push("/auth")
        return
      }

      // Make API call to register the organization
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/orgs/create-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orgName: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          city: formData.city,
          state: formData.state,
          website_url: formData.website_url || undefined,
          location_url: formData.location_url || undefined,
          password: formData.password
        })
      })

      const result = await response.json()

      if (response.ok && result.status === "success") {
        // Save organization email to localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('organization-email', formData.email)
        }
        
        toast({
          title: t('institution.registrationSuccess'),
          description: t('institution.registrationSuccessDesc'),
        })
        // Redirect to organization dashboard
        setTimeout(() => {
          router.push("/organization")
        }, 1500) // Give time for the success toast to be seen
      } else {
        throw new Error(result.message || "Registration failed")
      }
    } catch (error) {
      toast({
        title: t('institution.registrationFailed'),
        description: t('institution.registrationFailedDesc'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="p-4 max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="group flex items-center transition-all duration-200"
              style={{color: '#212153'}}
            >
              <div className="p-2 rounded-xl bg-white shadow-md group-hover:shadow-lg transition-all duration-200 border border-gray-200">
                <ArrowLeft className="h-4 w-4" />
              </div>
            </button>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl shadow-xl" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{color: '#212153'}}>
                    {t('institution.title')}
                  </h1>
                  <p className="text-gray-600">Join BusBuddy as an institutional partner</p>
                </div>
              </div>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto py-8">
        <Card className="bg-white shadow-xl border border-gray-200 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold" style={{color: '#212153'}}>{t('institution.title')}</CardTitle>
            <CardDescription className="text-gray-600">{t('institution.subtitle')}</CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <Mail className="h-4 w-4" />
                  <span>{t('institution.email')} *</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('institution.enterEmail')}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
                  style={{color: '#212153'}}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <Lock className="h-4 w-4" />
                  <span>{t('institution.password')} *</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('institution.createPassword')}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
                  style={{color: '#212153'}}
                />
              </div>

              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="orgName" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <Building2 className="h-4 w-4" />
                  <span>{t('institution.orgName')} *</span>
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder={t('institution.enterOrgName')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
                  style={{color: '#212153'}}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <Phone className="h-4 w-4" />
                  <span>{t('institution.phone')} *</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('institution.enterPhone')}
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
                  style={{color: '#212153'}}
                />
              </div>

              {/* State Selection */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <MapPin className="h-4 w-4" />
                  <span>{t('institution.state')} *</span>
                </Label>
                <Select onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder={t('institution.selectState')} />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Search */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <MapPin className="h-4 w-4" />
                  <span>{t('institution.city')} *</span>
                </Label>
                <CitySearch
                  selectedState={formData.state}
                  onCitySelect={(city: string) => handleInputChange('city', city)}
                  value={formData.city}
                />
              </div>

              {/* Location Picker */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <MapIcon className="h-4 w-4" />
                  <span>{t('institution.location')} ({t('common.optional')})</span>
                </Label>
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="website" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
                  <Globe className="h-4 w-4" />
                  <span>{t('institution.website')} ({t('common.optional')})</span>
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder={t('institution.enterWebsite')}
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
                  style={{color: '#212153'}}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-base"
                disabled={isLoading}
                style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('institution.submittingRegistration')}
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    {t('institution.registerButton')}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                By registering, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Toaster />
    </div>
  )
}