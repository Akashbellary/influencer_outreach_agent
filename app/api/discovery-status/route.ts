import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("jobId")
    if (!jobId) return NextResponse.json({ success: false, error: "jobId required" }, { status: 400 })

    const res = await fetch(`http://127.0.0.1:8000/discovery-status/${jobId}`)
    const data = await res.json()
    if (!res.ok || !data.success) {
      return NextResponse.json({ success: false, error: data.message || "Failed to get status" }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ success: false, error: "Status error" }, { status: 500 })
  }
}


