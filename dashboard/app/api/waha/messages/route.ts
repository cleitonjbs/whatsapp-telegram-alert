import { NextResponse } from 'next/server'

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3001'
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'changeme'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const session = searchParams.get('session') || 'default'
  const limit = searchParams.get('limit') || '50'

  try {
    const res = await fetch(
      `${WAHA_URL}/api/${session}/messages/overview?limit=${limit}&downloadMedia=false`,
      {
        headers: { 'X-Api-Key': WAHA_API_KEY },
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(5000),
      },
    )

    if (!res.ok) {
      return NextResponse.json([], { status: res.status })
    }

    const data = await res.json()
    const messages = Array.isArray(data) ? data : data.messages || []

    // Normaliza para o formato interno
    const normalized = messages
      .filter((m: Record<string, unknown>) => !m.fromMe)
      .map((m: Record<string, unknown>) => {
        const data = (m._data || {}) as Record<string, unknown>
        return {
          id: m.id,
          session,
          from: m.from,
          senderName: (data.notifyName as string) || (data.pushName as string) || String(m.from || '').replace('@c.us', ''),
          body: m.body || '',
          type: m.type || 'text',
          hasMedia: m.hasMedia || false,
          timestamp: m.timestamp,
          fromMe: m.fromMe || false,
        }
      })

    return NextResponse.json(normalized)
  } catch {
    return NextResponse.json([], { status: 503 })
  }
}
