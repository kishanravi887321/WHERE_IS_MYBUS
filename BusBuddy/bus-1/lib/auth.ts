export interface User {
  id: string
  username: string
  email: string
  type: "passenger" | "driver"
}

export interface AuthResponse {
  statusCode: number
  data: {
    userLoggedIn: User
    accessToken: string
    refreshToken: string
  }
  message: string
  success: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export class AuthService {
  private static instance: AuthService
  private accessToken: string | null = null
  private refreshToken: string | null = null

  private constructor() {
    // Load tokens from localStorage on initialization
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken")
      this.refreshToken = localStorage.getItem("refreshToken")
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    })

    const data: AuthResponse = await response.json()

    if (data.success) {
      this.setTokens(data.data.accessToken, data.data.refreshToken, data.data.userLoggedIn)
    }

    return data
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data: AuthResponse = await response.json()

    if (data.success) {
      this.setTokens(data.data.accessToken, data.data.refreshToken, data.data.userLoggedIn)
    }

    return data
  }

  async logout(): Promise<void> {
    if (this.accessToken) {
      try {
        await fetch(`${API_BASE_URL}/api/users/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        })
      } catch (error) {
        console.error("Logout error:", error)
      }
    }

    this.clearTokens()
  }

  private setTokens(accessToken: string, refreshToken: string, user?: User): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      if (user) {
        localStorage.setItem("user", JSON.stringify(user))
      }
    }
  }

  private clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null

    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")
    }
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      if (userData) {
        try {
          return JSON.parse(userData)
        } catch (error) {
          console.error("Error parsing user data:", error)
          return null
        }
      }
    }
    return null
  }
}
