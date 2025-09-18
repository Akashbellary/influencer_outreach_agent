"use client"

import { useEffect, useState } from "react"

type Props = { src: string; replaceProjectName?: boolean }

export function PublicText({ src, replaceProjectName = true }: Props) {
  const [text, setText] = useState("")

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const res = await fetch(src, { cache: "no-store" })
        const raw = await res.text()
        const processed = replaceProjectName ? raw.replaceAll("[Your Project Name]", "CampaignIO") : raw
        if (mounted) setText(processed)
      } catch (e) {
        console.log("[v0] Failed to load text:", e)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [src, replaceProjectName])

  // Function to convert plain text to formatted JSX
  const renderTextContent = () => {
    if (!text) return <p>Loading...</p>
    
    // Split text into paragraphs by double newlines
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '')
    
    return (
      <>
        {paragraphs.map((paragraph, index) => {
          // Skip empty paragraphs
          if (paragraph.trim() === '') return null
          
          // Check if paragraph is a heading (all caps or starts with specific words)
          const isHeading = /^[A-Z\s&]+$/.test(paragraph.trim()) || 
                           paragraph.startsWith('Terms') || 
                           paragraph.startsWith('Use') || 
                           paragraph.startsWith('Intellectual') || 
                           paragraph.startsWith('Links') || 
                           paragraph.startsWith('Changes') || 
                           paragraph.startsWith('Contact') ||
                           paragraph.startsWith('About') ||
                           paragraph.startsWith('Our') ||
                           paragraph.startsWith('The') ||
                           paragraph.startsWith('Why') ||
                           paragraph.startsWith('Join')
          
          if (isHeading && paragraph.trim() !== '') {
            return <h2 key={index} className="text-xl font-bold mt-6 mb-3">{paragraph}</h2>
          }
          
          // Check if paragraph is a list item (starts with bullet point)
          if (paragraph.trim().startsWith('👉') || paragraph.trim().startsWith('-') || paragraph.trim().startsWith('*')) {
            const listItem = paragraph.trim().startsWith('👉') 
              ? paragraph.trim().substring(1).trim() 
              : paragraph.trim().substring(1).trim()
            return (
              <ul key={index} className="list-disc pl-6 my-2">
                <li>{listItem}</li>
              </ul>
            )
          }
          
          // Check for special formatting like emojis
          if (paragraph.includes('✨')) {
            const items = paragraph.split('✨').filter(item => item.trim() !== '')
            return (
              <ul key={index} className="list-disc pl-6 my-2 space-y-1">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item.trim()}</li>
                ))}
              </ul>
            )
          }
          
          // Regular paragraph
          if (paragraph.trim() !== '') {
            return <p key={index} className="my-3">{paragraph}</p>
          }
          
          return null
        })}
      </>
    )
  }

  return <article className="text-[15px] leading-6">{renderTextContent()}</article>
}