'use client'

import useSWR from 'swr'
import type { BridgeStatus, WahaSession, WahaMessage } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useBridgeStatus() {
  return useSWR<BridgeStatus>('/api/bridge/status', fetcher, { refreshInterval: 10000 })
}

export function useWahaSessions() {
  return useSWR<WahaSession[]>('/api/waha/sessions', fetcher, { refreshInterval: 15000 })
}

export function useWahaMessages(session = 'default') {
  return useSWR<WahaMessage[]>(
    `/api/waha/messages?session=${session}&limit=50`,
    fetcher,
    { refreshInterval: 8000 },
  )
}
