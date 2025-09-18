"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

interface SocialIcon {
  id: number
  x: number
  y: number
  speed: number
  direction: 1 | -1
  row: number
  icon: string
  color: string
  originalColor: string
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isMouseOverElement, setIsMouseOverElement] = useState(false)
  const { theme } = useTheme()
  const animationRef = useRef<number>()

  const icons = useRef<SocialIcon[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const initIcons = () => {
      icons.current = []
      const iconTypes = [
        { icon: "IG", color: "#E4405F" },
        { icon: "TW", color: "#1DA1F2" },
        { icon: "TT", color: "#000000" },
        { icon: "YT", color: "#FF0000" },
        { icon: "WA", color: "#25D366" },
        { icon: "LI", color: "#0077B5" },
      ]

      const rows = 6
      const iconsPerRow = 8

      for (let row = 0; row < rows; row++) {
        for (let i = 0; i < iconsPerRow; i++) {
          const iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)]
          icons.current.push({
            id: row * iconsPerRow + i,
            x: i * 200 - 100,
            y: row * 120 + 50,
            speed: 1 + Math.random() * 2,
            direction: row % 2 === 0 ? 1 : -1,
            row,
            icon: iconType.icon,
            color: theme === "dark" ? "#4a5568" : "#a0aec0",
            originalColor: iconType.color,
          })
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })

      // Check if mouse is over interactive elements
      const target = e.target as HTMLElement
      const isOverInteractive = target.closest("button, input, .card, header, main > *")
      setIsMouseOverElement(!!isOverInteractive)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      icons.current.forEach((icon) => {
        // Move icons
        icon.x += icon.speed * icon.direction

        // Reset position when off screen
        if (icon.direction === 1 && icon.x > canvas.width + 50) {
          icon.x = -50
        } else if (icon.direction === -1 && icon.x < -50) {
          icon.x = canvas.width + 50
        }

        // Calculate distance from mouse
        const distance = Math.sqrt(Math.pow(icon.x - mousePos.x, 2) + Math.pow(icon.y - mousePos.y, 2))

        // Change color based on mouse proximity and element state
        if (!isMouseOverElement && distance < 100) {
          const intensity = 1 - distance / 100
          icon.color = icon.originalColor
          ctx.globalAlpha = 0.3 + intensity * 0.7
        } else {
          icon.color = theme === "dark" ? "#4a5568" : "#a0aec0"
          ctx.globalAlpha = 0.2
        }

        // Draw icon
        ctx.fillStyle = icon.color
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "center"
        ctx.fillText(icon.icon, icon.x, icon.y)
      })

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    initIcons()
    animate()

    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [theme, mousePos.x, mousePos.y, isMouseOverElement])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ background: "transparent" }} />
  )
}
