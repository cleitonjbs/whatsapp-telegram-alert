import { NextResponse } from 'next/server'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3000'

export async function GET() {
  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { status: 'error', uptime: 0, timestamp: new Date().toISOString() },
      { status: 503 },
    )
  }
}
