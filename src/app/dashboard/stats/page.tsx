'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCard } from '@/components/dashboard/StatCard'
import { OrdersBarChart } from '@/components/stats/OrdersBarChart'
import { RevenueLineChart } from '@/components/stats/RevenueLineChart'
import { PlatformChart } from '@/components/stats/PlatformChart'
import { Spinner } from '@/components/ui/Spinner'
import { TrendingUp, ShoppingBag, DollarSign, BarChart3 } from 'lucide-react'

type Range = 'week' | 'month' | 'quarter'

interface StatsData {
  ordersPerDay: Array<{ date: string; orders: number; revenue: number }>
  revenuePerPlatform: Array<{ platform: string; orders: number; revenue: number }>
  avgOrderValue: number
  totalRevenue: number
  totalOrders: number
  topItems: Array<{ title: string; orders: number; revenue: number }>
}

const RANGES: { value: Range; label: string }[] = [
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'quarter', label: '90d' },
]

export default function StatsPage() {
  const [range, setRange] = useState<Range>('month')
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stats?range=${range}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [range])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Revenue and order trends across your accounts.</p>
        </div>

        {/* Range selector */}
        <div className="flex rounded-lg border border-gray-700/50 bg-[#0d1120] p-0.5">
          {RANGES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                range === value
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total revenue"
              value={`£${data.totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              accent
            />
            <StatCard
              label="Total orders"
              value={data.totalOrders}
              icon={ShoppingBag}
            />
            <StatCard
              label="Avg order value"
              value={`£${data.avgOrderValue.toFixed(2)}`}
              icon={TrendingUp}
            />
            <StatCard
              label="Platforms"
              value={data.revenuePerPlatform.length}
              icon={BarChart3}
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders per day</CardTitle>
              </CardHeader>
              <OrdersBarChart data={data.ordersPerDay} />
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue per day</CardTitle>
              </CardHeader>
              <RevenueLineChart data={data.ordersPerDay} />
            </Card>
          </div>

          {/* Platform + top items */}
          <div className="grid gap-6 lg:grid-cols-2">
            {data.revenuePerPlatform.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by platform</CardTitle>
                </CardHeader>
                <PlatformChart data={data.revenuePerPlatform} />
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Top items</CardTitle>
              </CardHeader>
              {data.topItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-600">No data for this period</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-700/40">
                      <th className="pb-2 text-left font-medium text-gray-600">Item</th>
                      <th className="pb-2 text-right font-medium text-gray-600">Orders</th>
                      <th className="pb-2 text-right font-medium text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {data.topItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 max-w-[200px] truncate text-gray-300">{item.title}</td>
                        <td className="py-2 text-right text-gray-400">{item.orders}</td>
                        <td className="py-2 text-right font-semibold text-gray-200">
                          £{item.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
