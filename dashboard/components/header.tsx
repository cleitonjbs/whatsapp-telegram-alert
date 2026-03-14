'use client'

import { Activity, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center px-6 gap-4 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
          <Activity className="w-4 h-4 text-accent-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">WAHA Monitor</span>
      </div>

      <div className="flex-1" />

      <nav className="hidden md:flex items-center gap-1">
        {['Visao Geral', 'Mensagens', 'Sessoes', 'Logs'].map((item) => (
          <button
            key={item}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="w-px h-5 bg-border" />

      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Atualizar dados"
        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
      </button>
    </header>
  )
}
