"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BackgroundFX } from "@/components/background-fx"
import { InteractiveHash } from "@/components/interactive-hash"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!name.trim()) {
      setError("Please enter your full name")
      return
    }
    
    if (!email.trim()) {
      setError("Please enter your email")
      return
    }
    
    if (!password) {
      setError("Please enter a password")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Registration successful, show success message and redirect to login
        alert("Account created successfully! Please sign in.")
        router.push("/")
      } else {
        setError(data.message || "Registration failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Registration error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundFX />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left: register container */}
        <div className="flex items-center justify-start p-6 md:p-10">
        <Card className="w-full max-w-md backdrop-blur-sm bg-background/80 border-border/50">
            <CardHeader className="text-left">
            <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
            <CardDescription className="text-lg">
              Join CampaignIO to connect with top influencers
            </CardDescription>
                </CardHeader>
                <CardContent>
            <form noValidate onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/")}>
                  Sign in
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

        {/* Right: interactive Three.js hash */}
        <div className="relative hidden md:block w-full h-full">
          <InteractiveHash />
    </div>
      </div>
    </div>
  )
}