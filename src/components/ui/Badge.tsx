import { clsx } from 'clsx'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet'

const variants: Record<Variant, string> = {
  default: 'bg-gray-700/50 text-gray-300',
  success: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20',
  info: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20',
  violet: 'bg-accent/15 text-accent-light ring-1 ring-accent/20',
}

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
