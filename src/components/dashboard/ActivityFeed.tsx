import { formatDistanceToNow } from 'date-fns'
import { ShoppingBag } from 'lucide-react'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { OrderStatus } from '@prisma/client'

interface ActivityItem {
  id: string
  itemTitle: string | null
  total: number
  currency: string
  status: OrderStatus
  platformCreatedAt: Date
  connectedAccount: { label: string }
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <ShoppingBag className="mb-2 h-8 w-8 text-gray-700" />
        <p className="text-sm text-gray-500">No recent activity</p>
        <p className="mt-1 text-xs text-gray-600">Orders will appear here once synced</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-500">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-300">
              {item.itemTitle ?? 'Order'}
            </p>
            <p className="text-xs text-gray-600">
              {item.connectedAccount.label} ·{' '}
              {formatDistanceToNow(new Date(item.platformCreatedAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <span className="text-xs font-semibold text-gray-200">
              {item.currency} {Number(item.total).toFixed(2)}
            </span>
            <StatusBadge status={item.status} />
          </div>
        </li>
      ))}
    </ul>
  )
}
