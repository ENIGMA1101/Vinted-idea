'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface DayData {
  date: string
  orders: number
  revenue: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700/50 bg-[#1a2035] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-gray-300">{label}</p>
      <p className="text-accent-light">{payload[0]?.value} orders</p>
    </div>
  )
}

export function OrdersBarChart({ data }: { data: DayData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(typeof d.date === 'string' ? parseISO(d.date) : new Date(d.date), 'dd MMM'),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2538" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#4b5563', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: '#4b5563', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
        <Bar dataKey="orders" fill="#7c3aed" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
