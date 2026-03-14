'use client'

import { MessageSquare, Send, AlertCircle, Smartphone, Activity, CheckCircle2, XCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { StatCard } from '@/components/stat-card'
import { MessageFeed } from '@/components/message-feed'
import { SessionPanel } from '@/components/session-panel'
import { LogViewer } from '@/components/log-viewer'
import { Badge, StatusDot } from '@/components/badge'
import { useBridgeStatus, useWahaSessions, useWahaMessages } from '@/hooks/use-dashboard'
import { formatTime } from '@/lib/utils'
import type { LogEntry } from '@/lib/types'
import { useMemo, useCallback } from 'react'

// Gera log entries simulados a partir dos dados reais
function buildLogs(
  bridgeOk: boolean,
  sessions: { name: string; status: string }[],
  messageCount: number,
): LogEntry[] {
  const now = new Date()
  const entries: LogEntry[] = []

  if (bridgeOk) {
    entries.push({
      id: 'bridge-ok',
      level: 'info',
      time: now.toISOString(),
      message: 'bridge: servico saudavel e respondendo',
    })
  } else {
    entries.push({
      id: 'bridge-err',
      level: 'error',
      time: now.toISOString(),
      message: 'bridge: nao foi possivel conectar ao servico bridge na porta 3000',
    })
  }

  sessions.forEach((s, i) => {
    entries.push({
      id: `session-${i}`,
      level: s.status === 'WORKING' ? 'info' : s.status === 'FAILED' ? 'error' : 'warn',
      time: new Date(now.getTime() - i * 2000).toISOString(),
      message: `waha: sessao "${s.name}" esta no estado ${s.status}`,
    })
  })

  if (messageCount > 0) {
    entries.push({
      id: 'msg-count',
      level: 'info',
      time: new Date(now.getTime() - 5000).toISOString(),
      message: `webhook: ${messageCount} mensagem(ns) recebida(s) e encaminhada(s) ao Telegram`,
    })
  }

  return entries
}

export default function DashboardPage() {
  const { data: bridge, isLoading: bridgeLoading, mutate: mutateBridge } = useBridgeStatus()
  const { data: sessions = [], isLoading: sessionsLoading, mutate: mutateSessions } = useWahaSessions()
  const { data: messages = [], isLoading: messagesLoading, mutate: mutateMessages } = useWahaMessages()

  const isRefreshing = bridgeLoading || sessionsLoading || messagesLoading

  const handleRefresh = useCallback(() => {
    mutateBridge()
    mutateSessions()
    mutateMessages()
  }, [mutateBridge, mutateSessions, mutateMessages])

  const bridgeOnline = bridge?.status === 'ok'
  const activeSessions = sessions.filter((s) => s.status === 'WORKING').length

  const logs = useMemo(
    () => buildLogs(bridgeOnline, sessions, messages.length),
    [bridgeOnline, sessions, messages.length],
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="flex-1 p-6 max-w-screen-xl mx-auto w-full">
        {/* Topbar de status */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground text-balance">Visao Geral</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitoramento WAHA &rarr; Telegram em tempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status bridge */}
            <div className="flex items-center gap-2 bg-surface border border-border rounded px-3 py-1.5">
              {bridgeOnline ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-danger" />
              )}
              <span className="text-xs text-muted-foreground">Bridge</span>
              <Badge variant={bridgeOnline ? 'success' : 'danger'}>
                <StatusDot variant={bridgeOnline ? 'success' : 'danger'} />
                {bridgeOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>

            {/* Uptime */}
            {bridge?.uptime !== undefined && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-surface border border-border rounded px-3 py-1.5">
                <Activity className="w-3.5 h-3.5" />
                {Math.floor(bridge.uptime / 60)}min uptime
              </div>
            )}

            {/* Ultima atualizacao */}
            {bridge?.timestamp && (
              <span className="hidden md:block text-xs text-muted-foreground font-mono">
                atualizado {formatTime(bridge.timestamp)}
              </span>
            )}
          </div>
        </div>

        {/* Cards de estatisticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Mensagens recebidas"
            value={messages.length}
            icon={MessageSquare}
            accent="default"
          />
          <StatCard
            label="Alertas enviados"
            value={messages.length}
            icon={Send}
            accent="success"
          />
          <StatCard
            label="Sessoes ativas"
            value={activeSessions}
            icon={Smartphone}
            accent={activeSessions > 0 ? 'success' : 'warning'}
          />
          <StatCard
            label="Erros recentes"
            value={logs.filter((l) => l.level === 'error').length}
            icon={AlertCircle}
            accent={logs.filter((l) => l.level === 'error').length > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* Grade principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Feed ocupa 2/3 */}
          <div className="lg:col-span-2">
            <MessageFeed messages={messages} isLoading={messagesLoading} />
          </div>

          {/* Sessoes ocupa 1/3 */}
          <SessionPanel sessions={sessions} isLoading={sessionsLoading} />
        </div>

        {/* Log viewer */}
        <LogViewer logs={logs} />
      </main>

      <footer className="border-t border-border px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          WAHA Monitor &mdash; WhatsApp &rarr; Telegram Bridge
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <span>bridge :3000</span>
          <span className="w-px h-3 bg-border" />
          <span>waha :3001</span>
          <span className="w-px h-3 bg-border" />
          <span>dashboard :3002</span>
        </div>
      </footer>
    </div>
  )
}
