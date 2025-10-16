"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Bus, Mail, Lock, LogIn } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface LoginFormProps {
  onSuccess: () => void
  onToggleMode: () => void
}

export function LoginForm({ onSuccess, onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const authService = AuthService.getInstance()
      const result = await authService.login(email, password)

      if (result.success) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${result.data.userLoggedIn.username}!`,
        })
        onSuccess()
      } else {
        toast({
          title: "Login failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-xl border border-gray-200 rounded-2xl overflow-hidden">
      <CardHeader className="text-center pb-6 pt-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-2xl shadow-lg" style={{background: 'linear-gradient(to bottom right, #212153, #1e1b4b)'}}>
            <Bus className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold" style={{color: '#212153'}}>{t('auth.welcomeBack')}</CardTitle>
        <CardDescription className="text-gray-600">{t('auth.loginToContinue')}</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
              <Mail className="h-4 w-4" />
              <span>{t('auth.email')}</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
              style={{color: '#212153'}}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
              <Lock className="h-4 w-4" />
              <span>{t('auth.password')}</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
              style={{color: '#212153'}}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-base"
            disabled={isLoading}
            style={{background: 'linear-gradient(to right, #212153, #1e1b4b)'}}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.loading')}
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                {t('auth.loginButton')}
              </>
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Button variant="link" onClick={onToggleMode} className="text-sm hover:underline" style={{color: '#212153'}}>
            {t('auth.switchToSignup')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
