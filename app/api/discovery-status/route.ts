import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("jobId")
    if (!jobId) return NextResponse.json({ success: false, error: "jobId required" }, { status: 400 })

    const base = process.env.BACKEND_BASE_URL
      ? process.env.BACKEND_BASE_URL
      : (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:8000' : 'http://127.0.0.1:8000')
    const res = await fetch(`${base}/discovery-status/${jobId}`)
    const data = await res.json()
    if (!res.ok || !data.success) {
      // propagate upstream status to avoid masking 404 as 500 in the UI
      return NextResponse.json({ success: false, error: data.message || "Failed to get status" }, { status: res.status || 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ success: false, error: "Status error" }, { status: 500 })
  }
}


