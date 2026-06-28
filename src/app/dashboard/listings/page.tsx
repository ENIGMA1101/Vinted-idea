'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { PlatformPill } from '@/components/orders/PlatformPill'
import { Badge } from '@/components/ui/Badge'
import { ListingStatus, Platform } from '@prisma/client'

interface Listing {
  id: string
  externalListingId: string
  title: string
  price: number
  currency: string
  status: ListingStatus
  quantity: number
  quantitySold: number
  category: string | null
  platform: Platform
  connectedAccount: { label: string }
}

const STATUS_VARIANT: Record<ListingStatus, 'success' | 'danger' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  ENDED: 'danger',
  SOLD: 'warning',
  DRAFT: 'default',
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ACTIVE')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/listings?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setListings(d.listings ?? []))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Listings</h1>
          <p className="mt-1 text-sm text-gray-500">Your active inventory across connected accounts.</p>
        </div>

        <div className="flex rounded-lg border border-gray-700/50 bg-[#0d1120] p-0.5">
          {(['ACTIVE', 'ENDED', 'SOLD'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === s ? 'bg-accent/20 text-accent-light' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700/50 py-20 text-center">
          <p className="text-sm text-gray-500">No {filter.toLowerCase()} listings found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-700/40 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/40">
                {['Platform', 'Title', 'Price', 'Qty', 'Sold', 'Status', 'Category'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-hover/50 transition-colors">
                  <td className="px-4 py-3">
                    <PlatformPill platform={l.platform} />
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="truncate text-xs text-gray-300">{l.title}</p>
                    <p className="text-[10px] text-gray-600">{l.connectedAccount.label}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-200">
                    {l.currency} {l.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{l.quantity}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{l.quantitySold}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[l.status]}>{l.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{l.category ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
