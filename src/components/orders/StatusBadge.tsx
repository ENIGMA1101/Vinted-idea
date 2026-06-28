import { OrderStatus } from '@prisma/client'
import { Badge } from '@/components/ui/Badge'

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'violet' | 'info' | 'warning' | 'success' | 'danger' }> = {
  NEW: { label: 'New', variant: 'violet' },
  PAID: { label: 'Paid', variant: 'info' },
  SHIPPED: { label: 'Shipped', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = STATUS_CONFIG[status]
  return <Badge variant={variant}>{label}</Badge>
}
