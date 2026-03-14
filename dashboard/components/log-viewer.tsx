'use client'

import { cn, formatTime } from '@/lib/utils'
import type { LogEntry } from '@/lib/types'

const levelClasses: Record<LogEntry['level'], string> = {
  info: 'text-accent',
  warn: 'text-warning',
  error: 'text-danger',
}

const levelLabel: Record<LogEntry['level'], string> = {
  info: 'INF',
  warn: 'WRN',
  error: 'ERR',
}

interface LogViewerProps {
  logs: LogEntry[]
}

export function LogViewer({ logs }: LogViewerProps) {
  return (
    <section className="bg-surface border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Log do Bridge</h2>
        <span className="text-xs text-muted-foreground font-mono">{logs.length} entradas</span>
      </div>

      <div className="overflow-y-auto max-h-72 font-mono text-xs">
        {logs.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">Nenhum log disponivel</div>
        )}

        {[...logs].reverse().map((entry) => (
          <div
            key={entry.id}
            className={cn(
              'flex items-start gap-3 px-5 py-2 border-b border-border/50 hover:bg-muted/40 transition-colors',
              entry.level === 'error' && 'bg-danger/5',
            )}
          >
            <span className="text-muted-foreground shrink-0 pt-px">{formatTime(entry.time)}</span>
            <span className={cn('shrink-0 font-semibold pt-px w-7', levelClasses[entry.level])}>
              {levelLabel[entry.level]}
            </span>
            <span className="text-foreground/80 leading-relaxed break-all">{entry.message}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
