import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch("http://127.0.0.1:8000/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return NextResponse.json({ success: false, error: data.message || "Failed" }, { status: 500 })
    }
    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8000/history")
    const data = await res.json()
    if (!res.ok || !data.success) {
      return NextResponse.json({ success: false, error: data.message || "Failed" }, { status: 500 })
    }
    return NextResponse.json({ success: true, items: data.items })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 })
  }
}


