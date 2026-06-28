'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
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
      <p className="text-emerald-400">£{payload[0]?.value?.toFixed(2)}</p>
    </div>
  )
}

export function RevenueLineChart({ data }: { data: DayData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(typeof d.date === 'string' ? parseISO(d.date) : new Date(d.date), 'dd MMM'),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v) => `£${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a3142', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 3, fill: '#10b981', stroke: '#0d1120', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
