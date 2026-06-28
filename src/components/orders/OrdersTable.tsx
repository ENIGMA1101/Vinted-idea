'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ArrowUpDown, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { StatusBadge } from './StatusBadge'
import { PlatformPill } from './PlatformPill'
import { OrderStatus, Platform } from '@prisma/client'

interface Order {
  id: string
  externalOrderId: string
  platform: Platform
  status: OrderStatus
  total: number
  currency: string
  buyerUsername: string | null
  itemTitle: string | null
  itemCount: number
  platformCreatedAt: string
  connectedAccount: { label: string; platform: Platform }
}

type SortKey = 'recent' | 'oldest' | 'platform'
type Tab = 'active' | 'completed'

export function OrdersTable() {
  const [tab, setTab] = useState<Tab>('active')
  const [sort, setSort] = useState<SortKey>('recent')
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab, sort })
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [tab, sort])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleComplete = async (orderId: string) => {
    setCompleting(orderId)
    // Optimistic
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED' as OrderStatus } : o))
    )
    try {
      await fetch(`/api/orders/${orderId}/complete`, { method: 'POST' })
      await fetchOrders()
    } catch {
      fetchOrders()
    } finally {
      setCompleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Tab toggle */}
        <div className="flex rounded-lg border border-gray-700/50 bg-[#0d1120] p-0.5">
          {(['active', 'completed'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-600" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent text-xs text-gray-400 focus:outline-none"
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest first</option>
            <option value="platform">By platform</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-700/40 bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-6 w-6" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-gray-400">No {tab} orders</p>
            <p className="mt-1 text-xs text-gray-600">
              {tab === 'active' ? 'Active orders will appear here after sync' : 'Completed orders will appear here'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/40">
                {['Platform', 'Order ID', 'Item', 'Buyer', 'Amount', 'Status', 'Date', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {orders.map((order) => (
                <tr key={order.id} className="group transition-colors hover:bg-hover/50">
                  <td className="px-4 py-3">
                    <PlatformPill platform={order.platform} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500">
                      {order.externalOrderId.slice(-10)}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <p className="truncate text-xs text-gray-300">
                      {order.itemTitle ?? '—'}
                    </p>
                    {order.itemCount > 1 && (
                      <p className="text-[10px] text-gray-600">{order.itemCount} items</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{order.buyerUsername ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-200">
                      {order.currency} {order.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {format(new Date(order.platformCreatedAt), 'dd MMM yyyy')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tab === 'active' && order.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleComplete(order.id)}
                        disabled={completing === order.id}
                        className="opacity-0 group-hover:opacity-100 text-emerald-500 hover:text-emerald-400"
                      >
                        {completing === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-right text-xs text-gray-600">{total} order{total !== 1 ? 's' : ''} total</p>
    </div>
  )
}
