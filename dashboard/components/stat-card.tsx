import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  accent?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const accentClasses = {
  default: 'text-accent bg-accent/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  danger: 'text-danger bg-danger/10',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  accent = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg p-5 flex flex-col gap-4',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
        <div className={cn('w-8 h-8 rounded flex items-center justify-center', accentClasses[accent])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold text-foreground tabular-nums leading-none">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trendUp ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
