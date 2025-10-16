"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Bus, Mail, Lock, UserPlus, User } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface RegisterFormProps {
  onSuccess: () => void
  onToggleMode: () => void
}

export function RegisterForm({ onSuccess, onToggleMode }: RegisterFormProps) {
  const [username, setUsername] = useState("")
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
      const result = await authService.register(username, email, password)

      if (result.success) {
        toast({
          title: "Registration successful",
          description: `Welcome to BusBuddy, ${result.data.userLoggedIn.username}!`,
        })
        onSuccess()
      } else {
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
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
        <CardTitle className="text-2xl font-bold" style={{color: '#212153'}}>Join BusBuddy</CardTitle>
        <CardDescription className="text-gray-600">Create your account to start tracking buses</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
              <User className="h-4 w-4" />
              <span>Username</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
              style={{color: '#212153'}}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium flex items-center space-x-2" style={{color: '#212153'}}>
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
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
              <span>Password</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </>
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Button variant="link" onClick={onToggleMode} className="text-sm hover:underline" style={{color: '#212153'}}>
            Already have an account? Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
