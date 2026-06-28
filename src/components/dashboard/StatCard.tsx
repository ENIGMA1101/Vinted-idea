import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  accent?: boolean
}

export function StatCard({ label, value, sub, icon: Icon, trend, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-700/40 bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
          <p className={clsx('mt-2 text-2xl font-bold', accent ? 'text-accent-light' : 'text-gray-100')}>
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
        <div
          className={clsx(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            accent ? 'bg-accent/20 text-accent-light' : 'bg-gray-800 text-gray-400'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
