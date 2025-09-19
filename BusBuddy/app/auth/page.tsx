"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { AuthService } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const authService = AuthService.getInstance()
    if (authService.isAuthenticated()) {
      router.push("/")
    }
  }, [router])

  const handleAuthSuccess = () => {
    router.push("/")
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onSuccess={handleAuthSuccess} onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onSuccess={handleAuthSuccess} onToggleMode={toggleMode} />
        )}
      </div>
      <Toaster />
    </div>
  )
}
