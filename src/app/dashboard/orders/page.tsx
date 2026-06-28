import { OrdersTable } from '@/components/orders/OrdersTable'

export const metadata = { title: 'Orders · ResellerHub' }

export default function OrdersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Unified view of orders across all connected accounts.</p>
      </div>
      <OrdersTable />
    </div>
  )
}
