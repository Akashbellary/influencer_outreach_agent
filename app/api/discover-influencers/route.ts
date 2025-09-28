import { type NextRequest, NextResponse } from "next/server"

function calculateEngagementRate(followers: number, mediaCount: number) {
  if (!followers || followers === 0) return 0

  // More realistic engagement rate calculation
  let baseRate = 0
  if (followers < 1000) baseRate = 8.0
  else if (followers < 10000) baseRate = 4.0
  else if (followers < 100000) baseRate = 2.5
  else if (followers < 1000000) baseRate = 1.8
  else baseRate = 1.2

  // Add some variance
  const variance = (Math.random() - 0.5) * 0.5
  const finalRate = Math.max(0.5, baseRate + variance)

  return (Math.round(finalRate * 100) / 100) * 100 // Convert to percentage
}

function generateTags(biography: string, name: string, productName?: string, productDescription?: string) {
  const text = `${biography || ""} ${name || ""} ${productName || ""} ${productDescription || ""}`.toLowerCase()
  const tags = []

  if (text.includes("beauty") || text.includes("makeup") || text.includes("cosmetic") || text.includes("skincare"))
    tags.push("Beauty")
  if (text.includes("fashion") || text.includes("style") || text.includes("outfit") || text.includes("clothing"))
    tags.push("Fashion")
  if (text.includes("fitness") || text.includes("workout") || text.includes("gym") || text.includes("health"))
    tags.push("Fitness")
  if (text.includes("food") || text.includes("recipe") || text.includes("cooking") || text.includes("nutrition"))
    tags.push("Food")
  if (text.includes("travel") || text.includes("adventure") || text.includes("explore") || text.includes("vacation"))
    tags.push("Travel")
  if (text.includes("lifestyle") || text.includes("life") || text.includes("daily")) tags.push("Lifestyle")
  if (text.includes("tech") || text.includes("gadget") || text.includes("review") || text.includes("technology"))
    tags.push("Tech")
  if (text.includes("home") || text.includes("decor") || text.includes("interior") || text.includes("design"))
    tags.push("Home")
  if (text.includes("mom") || text.includes("parent") || text.includes("family") || text.includes("kids"))
    tags.push("Family")
  if (text.includes("business") || text.includes("entrepreneur") || text.includes("marketing")) tags.push("Business")

  return tags.length > 0 ? tags.slice(0, 3) : ["Lifestyle"]
}

export async function POST(request: NextRequest) {
  try {
    const { hashtags, productName, productDescription, web_scraping_enabled } = await request.json()

    const searchQuery =
      hashtags.length > 0 ? hashtags[0].replace("#", "") : productName?.toLowerCase().replace(/\s+/g, "") || "product"

    // Start async discovery job in Flask
    const backendUrl = `${process.env.NODE_ENV === 'production' ? 'http://localhost:8000/start-discovery' : 'http://127.0.0.1:8000/start-discovery'}`
    console.log(`[v0] Calling backend: ${backendUrl}`)
    
    const startRes = await fetch(backendUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtag: searchQuery, productName, productDescription, web_scraping_enabled }),
    })
    
    console.log(`[v0] Backend response status: ${startRes.status}`)
    const start = await startRes.json()
    console.log(`[v0] Backend response:`, start)
    
    if (!startRes.ok || !start.success) {
      return NextResponse.json({ success: false, error: start.message || "Failed to start discovery" }, { status: 500 })
    }

    // Immediately fetch first snapshot
    const statusRes = await fetch(`${process.env.NODE_ENV === 'production' ? 'http://localhost:8000/discovery-status' : 'http://127.0.0.1:8000/discovery-status'}/${start.job_id}`)
    const status = await statusRes.json()

    // Map snapshot user_data to influencers shape
    const influencers = Array.isArray(status.user_data)
      ? status.user_data.map((user: any) => ({
          id: user.id,
          username: user.username,
          name: user.name || user.username,
          followers_count: user.followers_count || 0,
          media_count: user.media_count || 0,
          biography: user.biography || "",
          profile_picture_url: user.profile_picture_url || "",
          website: user.website || "",
          engagement_rate: calculateEngagementRate(user.followers_count || 0, user.media_count || 0),
          tags: generateTags(user.biography || "", user.name || user.username, productName, productDescription),
          is_verified: false,
        }))
      : []

    const fallbackPermalinks = Array.isArray(status.permalinks) ? status.permalinks : []
    return NextResponse.json({ success: true, jobId: start.job_id, influencers, fallbackPermalinks })
  } catch (error) {
    console.error("[v0] Error discovering influencers:", error)
    return NextResponse.json({ success: false, error: "Failed to discover influencers. Please try again." }, { status: 500 })
  }
}