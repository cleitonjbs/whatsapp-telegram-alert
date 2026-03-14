import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(ts: number | string | undefined): string {
  if (!ts) return '—'
  const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDate(ts: number | string | undefined): string {
  if (!ts) return '—'
  const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function relativeTime(ts: number | string | undefined): string {
  if (!ts) return '—'
  const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}
