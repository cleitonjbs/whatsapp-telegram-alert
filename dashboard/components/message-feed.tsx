'use client'

import { MessageSquare, Image, FileText, Phone } from 'lucide-react'
import { Badge } from './badge'
import { relativeTime } from '@/lib/utils'
import type { WahaMessage } from '@/lib/types'

const typeIcon: Record<string, React.ReactNode> = {
  text: <MessageSquare className="w-3.5 h-3.5" />,
  image: <Image className="w-3.5 h-3.5" />,
  document: <FileText className="w-3.5 h-3.5" />,
  audio: <Phone className="w-3.5 h-3.5" />,
  video: <Image className="w-3.5 h-3.5" />,
}

interface MessageFeedProps {
  messages: WahaMessage[]
  isLoading?: boolean
}

export function MessageFeed({ messages, isLoading }: MessageFeedProps) {
  return (
    <section className="bg-surface border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Feed de Mensagens</h2>
        <span className="text-xs text-muted-foreground">{messages.length} recentes</span>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-border">
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Carregando...
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <MessageSquare className="w-8 h-8 text-border" />
            <span className="text-sm text-muted-foreground">Nenhuma mensagem recebida ainda</span>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="px-5 py-3.5 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {(msg.senderName || msg.from)[0]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {msg.senderName || msg.from.replace('@c.us', '')}
                  </span>
                  <Badge variant="muted">
                    {typeIcon[msg.type] || typeIcon.text}
                    <span>{msg.type}</span>
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {msg.body || '[midia sem legenda]'}
                </p>
              </div>

              <span className="text-xs text-muted-foreground shrink-0 pt-0.5 font-mono">
                {relativeTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
