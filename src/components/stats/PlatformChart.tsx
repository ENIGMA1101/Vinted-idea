'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface PlatformData {
  platform: string
  orders: number
  revenue: number
}

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700/50 bg-[#1a2035] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-gray-300">{label}</p>
      <p className="text-accent-light">{payload[0]?.value} orders</p>
      <p className="text-emerald-400">£{payload[1]?.value?.toFixed(2)} revenue</p>
    </div>
  )
}

export function PlatformChart({ data }: { data: PlatformData[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={4}>
        <XAxis
          dataKey="platform"
          tick={{ fill: '#4b5563', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
        <Bar dataKey="orders" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
