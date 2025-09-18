import { NextRequest, NextResponse } from "next/server"

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, influencers } = body || {}
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    const res = await fetch(`http://127.0.0.1:8000/history/${encodeURIComponent(id)}/influencers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ influencers: influencers || [] }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) return NextResponse.json({ success: false, error: data.message || "Failed" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 })
  }
}


