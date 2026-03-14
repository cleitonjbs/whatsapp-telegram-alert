import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted' | 'accent'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  muted: 'bg-muted text-muted-foreground border-border',
  accent: 'bg-accent/15 text-accent border-accent/30',
}

export function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusDot({ variant = 'muted' }: { variant?: BadgeVariant }) {
  const dotClasses: Record<BadgeVariant, string> = {
    success: 'bg-success',
    warning: 'bg-warning animate-pulse',
    danger: 'bg-danger animate-pulse',
    muted: 'bg-muted-foreground',
    accent: 'bg-accent',
  }
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full', dotClasses[variant])} />
}
