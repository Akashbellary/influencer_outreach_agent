"use client"

import { useEffect, useState } from "react"

type Props = {
  src: string
  projectName?: string
  contactEmail?: string
  className?: string
}

export default function PublicTextViewer({
  src,
  projectName = "CampaignIO",
  contactEmail = "akashbellaryramesh123@gmail.com",
  className = "",
}: Props) {
  const [content, setContent] = useState("Loading...")

  useEffect(() => {
    let mounted = true
    fetch(src)
      .then((r) => r.text())
      .then((t) => {
        if (!mounted) return
        let text = t
          .replaceAll("[Your Project Name]", projectName)
          .replaceAll("{{PROJECT_NAME}}", projectName)
          .replaceAll("PROJECT_NAME", projectName)

        // Remove address lines if present
        text = text
          .split("\n")
          .filter((line) => !/^\s*address[:\s]/i.test(line))
          .join("\n")

        // Ensure contact email is present (replace placeholders or append)
        const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
        if (!text.toLowerCase().includes(contactEmail.toLowerCase())) {
          // Replace any existing email or append at end
          if (emailRegex.test(text)) {
            text = text.replace(emailRegex, contactEmail)
          } else {
            text += `\n\nContact: ${contactEmail}`
          }
        }
        setContent(text)
      })
      .catch(() => {
        if (mounted) setContent("Content unavailable. Please try again later.")
      })
    return () => {
      mounted = false
    }
  }, [src, projectName, contactEmail])

  return (
    <div className={`whitespace-pre-wrap text-pretty leading-relaxed text-sm md:text-base ${className}`}>{content}</div>
  )
}