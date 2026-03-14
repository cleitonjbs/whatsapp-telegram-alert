'use client'

import { Smartphone, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Badge, StatusDot } from './badge'
import type { WahaSession } from '@/lib/types'

const statusMap: Record<
  WahaSession['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'muted' }
> = {
  WORKING: { label: 'Conectado', variant: 'success' },
  SCAN_QR_CODE: { label: 'Aguardando QR', variant: 'warning' },
  STARTING: { label: 'Iniciando', variant: 'warning' },
  FAILED: { label: 'Falhou', variant: 'danger' },
  STOPPED: { label: 'Parado', variant: 'muted' },
}

interface SessionPanelProps {
  sessions: WahaSession[]
  isLoading?: boolean
}

export function SessionPanel({ sessions, isLoading }: SessionPanelProps) {
  return (
    <section className="bg-surface border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Sessoes WhatsApp</h2>
        <span className="text-xs text-muted-foreground">{sessions.length} sessao(es)</span>
      </div>

      <div className="divide-y divide-border flex-1">
        {isLoading && sessions.length === 0 && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verificando sessoes...</span>
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <WifiOff className="w-8 h-8 text-border" />
            <span className="text-sm text-muted-foreground">Nenhuma sessao WAHA encontrada</span>
            <span className="text-xs text-muted-foreground">
              Acesse{' '}
              <a
                href="http://localhost:3001/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                localhost:3001/dashboard
              </a>{' '}
              para criar uma sessao
            </span>
          </div>
        )}

        {sessions.map((session) => {
          const info = statusMap[session.status] ?? { label: session.status, variant: 'muted' as const }
          return (
            <div key={session.name} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                {session.status === 'WORKING' ? (
                  <Wifi className="w-4 h-4 text-success" />
                ) : session.status === 'STARTING' ? (
                  <Loader2 className="w-4 h-4 text-warning animate-spin" />
                ) : (
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{session.name}</span>
                  <Badge variant={info.variant}>
                    <StatusDot variant={info.variant} />
                    {info.label}
                  </Badge>
                </div>
                {session.me && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {session.me.pushName} &middot; {session.me.id.replace('@c.us', '')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
