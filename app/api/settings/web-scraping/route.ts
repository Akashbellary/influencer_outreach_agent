import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const backendUrl = `${process.env.NODE_ENV === 'production' ? 'http://localhost:8000/api/settings/web-scraping' : 'http://127.0.0.1:8000/api/settings/web-scraping'}`
    
    const response = await fetch(backendUrl, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.error || "Failed to get settings" }, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error getting web scraping setting:", error)
    return NextResponse.json({ success: false, error: "Failed to get settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { web_scraping_enabled } = body
    
    const backendUrl = `${process.env.NODE_ENV === 'production' ? 'http://localhost:8000/api/settings/web-scraping' : 'http://127.0.0.1:8000/api/settings/web-scraping'}`
    
    const response = await fetch(backendUrl, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ web_scraping_enabled }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.error || "Failed to update settings" }, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating web scraping setting:", error)
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}