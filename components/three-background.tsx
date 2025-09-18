"use client"

import { useEffect, useState } from "react"

const socialIcons = [
  { icon: "📱", name: "Instagram", color: "#E4405F" },
  { icon: "🐦", name: "Twitter", color: "#1DA1F2" },
  { icon: "🎵", name: "TikTok", color: "#000000" },
  { icon: "📺", name: "YouTube", color: "#FF0000" },
  { icon: "💼", name: "LinkedIn", color: "#0077B5" },
  { icon: "👥", name: "Facebook", color: "#1877F2" },
]

export function ThreeBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 animate-pulse" />

      {/* Floating social media icons */}
      <div className="absolute inset-0">
        {socialIcons.map((social, index) => (
          <div
            key={index}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shadow-lg backdrop-blur-sm border border-white/20 hover:scale-110 transition-transform cursor-pointer"
              style={{ backgroundColor: `${social.color}20` }}
            >
              {social.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
