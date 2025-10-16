"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bus, MapPin, Users, Star, ArrowRight, LogIn, UserPlus, LogOut, Baby, Building2, Map, ChevronRight, Mail, Phone, MapIcon, Facebook, Twitter, Instagram, ExternalLink, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthService } from "@/lib/auth"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/ui/language-selector"
import { AIChatbot } from "@/components/ui/ai-chatbot"



export default function HeroPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasOrganization, setHasOrganization] = useState(false)
  const [isCheckingOrganization, setIsCheckingOrganization] = useState(false)

  useEffect(() => {
    const authService = AuthService.getInstance()
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    
    // Check if user has an organization if authenticated
    if (authenticated) {
      checkOrganizationExists()
    }
  }, [])

  const checkOrganizationExists = async () => {
    try {
      setIsCheckingOrganization(true)
      const authService = AuthService.getInstance()
      const currentUser = authService.getCurrentUser()
      const accessToken = authService.getAccessToken()
      
      if (!currentUser || !accessToken) {
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/orgs/check-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: currentUser.email
        })
      })

      const result = await response.json()
      
      if (response.ok && result.status === "success") {
        setHasOrganization(true)
      } else {
        setHasOrganization(false)
      }
    } catch (error) {
      console.error('Error checking organization:', error)
      setHasOrganization(false)
    } finally {
      setIsCheckingOrganization(false)
    }
  }

  const handleLogout = async () => {
    try {
      const authService = AuthService.getInstance()
      await authService.logout()
      setIsAuthenticated(false)
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      })
    }
  }

  const handleServiceCardClick = (serviceName: string) => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      router.push("/auth")
    } else if (serviceName === "Register Your Organization" || serviceName === "Manage Your Organization") {
      if (hasOrganization) {
        // Redirect to organization dashboard
        router.push("/organization")
      } else {
        // Redirect to organization registration page
        router.push("/institution-register")
      }
    } else if (serviceName === "Courier Tracking Service") {
      // Redirect to courier tracking page
      router.push("/courier")
    } else {
      // User is authenticated, other features coming soon
      toast({
        title: t('common.comingSoon'),
        description: `${serviceName} ${t('messages.featureComingSoon')}`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 sm:mb-16 gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-indigo-900 rounded-xl sm:rounded-2xl blur-sm opacity-50"></div>
                <div className="relative p-2 sm:p-3 bg-gradient-to-br from-slate-800 to-indigo-900 rounded-xl sm:rounded-2xl shadow-xl" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                  <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{t('common.busbuddy')}</h1>
                <p className="text-xs sm:text-sm" style={{color: '#212153'}}>{t('common.smartTransitCompanion')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <LanguageSelector />
              {!isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/auth")}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm"
                    style={{borderColor: '#212153', color: '#212153'}}
                  >
                    <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('common.login')}</span>
                  </Button>
                  <Button
                    onClick={() => router.push("/auth")}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 text-white rounded-xl sm:rounded-2xl font-medium shadow-lg text-xs sm:text-sm"
                    style={{backgroundColor: '#212153'}}
                  >
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('common.signup')}</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 border-red-500 text-red-600 hover:bg-red-50 rounded-xl sm:rounded-2xl font-medium bg-transparent text-xs sm:text-sm"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('common.logout')}</span>
                </Button>
              )}
            </div>
          </header>

          {/* Hero Content */}
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-6 px-2">
              {t('landing.hero.title')}
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              {t('landing.hero.subtitle')}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 max-w-lg sm:max-w-2xl mx-auto mb-6 sm:mb-12 px-4">
              <Button
                className="group relative overflow-hidden text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 h-auto shadow-lg transition-all duration-300 w-full"
                style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}
                onClick={() => router.push("/passenger")}
              >
                <div className="flex items-center justify-center gap-3">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                  <div className="text-center sm:text-left">
                    <div className="font-semibold text-base sm:text-lg">{t('landing.passenger.title')}</div>
                    <div className="text-sm opacity-90">{t('landing.passenger.subtitle')}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="group relative overflow-hidden bg-white/90 hover:bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 h-auto shadow-lg transition-all duration-300 w-full"
                style={{borderColor: '#212153', color: '#212153', borderWidth: '2px'}}
                onClick={() => router.push("/driver")}
              >
                <div className="flex items-center justify-center gap-3">
                  <Bus className="h-5 w-5 sm:h-6 sm:w-6" />
                  <div className="text-center sm:text-left">
                    <div className="font-semibold text-base sm:text-lg">{t('landing.driver.title')}</div>
                    <div className="text-sm opacity-90">{t('landing.driver.subtitle')}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-12 px-4">
              {[
                { number: "10K+", label: "Active Users", icon: Users },
                { number: "500+", label: "Bus Routes", icon: Bus },
                { number: "4.8", label: "User Rating", icon: Star },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl shadow-lg mb-2 sm:mb-4" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                    <stat.icon className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm sm:text-base text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* More Services Section */}
      <section className="relative py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              {t('landing.services.title')}
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t('landing.services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 max-w-6xl mx-auto">
            {/* Courier Tracking Card */}
            <Card 
              className="group relative overflow-hidden bg-white border-2 hover:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl cursor-pointer" 
              style={{borderColor: '#201f50'}}
              onClick={() => handleServiceCardClick("Courier Tracking Service")}
            >
              <CardHeader className="px-3 sm:px-5 py-2 sm:py-3">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg" style={{background: 'linear-gradient(to bottom right, #201f50, #181640)'}}>
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-center" style={{color: '#201f50'}}>
                  {t('landing.courierTracking.title')}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 text-center mb-1">
                  {t('landing.courierTracking.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-5 py-1 sm:py-2">
                <div className="flex items-center justify-center text-sm sm:text-base font-medium" style={{color: '#201f50'}}>
                  <span>{t('landing.courierTracking.action')}</span>
                  <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>

            {/* Register/Manage Institution Card */}
            <Card 
              className="group relative overflow-hidden bg-white border-2 hover:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl cursor-pointer busbuddy-primary-border" 
              onClick={() => handleServiceCardClick(hasOrganization ? "Manage Your Organization" : "Register Your Organization")}
            >
              <CardHeader className="px-3 sm:px-5 py-2 sm:py-3">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-center" style={{color: '#212153'}}>
                  {isCheckingOrganization ? 'Checking...' : (hasOrganization ? t('landing.institution.manageTitle') : t('landing.institution.title'))}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 text-center mb-1">
                  {isCheckingOrganization ? 'Please wait...' : (hasOrganization ? t('landing.institution.manageDescription') : t('landing.institution.description'))}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-5 py-1 sm:py-2">
                <div className="flex items-center justify-center text-sm sm:text-base font-medium" style={{color: '#212153'}}>
                  <span>{isCheckingOrganization ? 'Loading...' : (hasOrganization ? t('landing.institution.manageAction') : t('landing.institution.action'))}</span>
                  <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>

            {/* Track City Bus Routes Card */}
            <Card 
              className="group relative overflow-hidden bg-white border-2 hover:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl cursor-pointer" 
              style={{borderColor: '#212153'}}
              onClick={() => handleServiceCardClick("Track City Bus Routes")}
            >
              <CardHeader className="px-3 sm:px-5 py-2 sm:py-3">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
                    <Map className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-center" style={{color: '#212153'}}>
                  {t('landing.cityBus.title')}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 text-center mb-1">
                  {t('landing.cityBus.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-5 py-1 sm:py-2">
                <div className="flex items-center justify-center text-sm sm:text-base font-medium" style={{color: '#212153'}}>
                  <span>{t('landing.cityBus.action')}</span>
                  <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Chatbot */}
      <AIChatbot />

    </div>
  )
}