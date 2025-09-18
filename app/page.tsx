"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BackgroundFX } from "@/components/background-fx"
import { InteractiveHash } from "@/components/interactive-hash"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Handle Google OAuth callback errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const userDataEncoded = urlParams.get("user_data");
    const errorMessage = urlParams.get("error");

    if (success === "true" && userDataEncoded) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataEncoded));
        localStorage.setItem("campaignio:auth", "1");
        localStorage.removeItem("campaignio:disclaimer-ack");
        localStorage.setItem("campaignio:force-disclaimer", "1");
        localStorage.setItem("campaignio:user-data", JSON.stringify(userData));
        // Redirect to home page after successful login
        router.push("/home");
      } catch (err) {
        console.error("LocalStorage error:", err);
        setError("Authentication successful but failed to store session data");
      } finally {
        // Clean up query params from URL
        window.history.replaceState({}, document.title, "/");
      }
    } else if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
      // Clean up query params
      window.history.replaceState({}, document.title, "/");
    }
  }, [router])

  // Handle login form
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        try {
          localStorage.setItem("campaignio:auth", "1")
          localStorage.removeItem("campaignio:disclaimer-ack")
          localStorage.setItem("campaignio:force-disclaimer", "1")
          if (data.user) {
            localStorage.setItem("campaignio:user-data", JSON.stringify(data.user))
          }
        } catch (err) {
          console.error("LocalStorage error:", err)
          setError("Login successful but failed to store session data")
          return
        }
        router.push("/home")
      } else {
        setError(data.message || "Login failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/google-login", {
        credentials: "include"
      })
      const data = await response.json()

      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        setError(data.message || "Failed to initiate Google login")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Google login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundFX />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left: Login form */}
        <div className="flex items-center justify-start p-6 md:p-10">
          <Card className="w-full max-w-md backdrop-blur-sm bg-background/80 border-border/50">
            <CardHeader className="text-left">
              <CardTitle className="text-3xl font-bold">CampaignIO</CardTitle>
              <CardDescription className="text-lg">
                Connect with top influencers and grow your brand through authentic partnerships
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form noValidate onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-sm text-gray-500">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Google Login */}
              <Button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 
                       1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 
                       3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 
                       1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 
                       20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 
                       8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 
                       2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 
                       7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              {/* Sign up + Terms */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {"Don't have an account?"}{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => router.push("/register")}
                  >
                    Sign up
                  </Button>
                </p>
              </div>
              <div className="mt-2 text-center">
                <Link
                  href="/home/about/terms"
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Terms & Conditions
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Interactive hash animation */}
        <div className="relative hidden md:block w-full h-full">
          <InteractiveHash />
        </div>
      </div>
    </div>
  )
}
