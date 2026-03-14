import { NextResponse } from 'next/server'

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3001'
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'changeme'

export async function GET() {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions`, {
      headers: { 'X-Api-Key': WAHA_API_KEY },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json([], { status: res.status })
    }

    const data = await res.json()
    // WAHA retorna array de sessoes
    const sessions = Array.isArray(data) ? data : data.sessions || []
    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json([], { status: 503 })
  }
}
