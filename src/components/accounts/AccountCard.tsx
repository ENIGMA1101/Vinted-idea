'use client'

import { useState } from 'react'
import { Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PlatformPill } from '@/components/orders/PlatformPill'
import { formatDistanceToNow } from 'date-fns'
import { Platform } from '@prisma/client'

interface Account {
  id: string
  label: string
  platform: Platform
  isActive: boolean
  createdAt: string
  syncLogs: Array<{ status: string; startedAt: string; completedAt: string | null }>
  _count: { orders: number; listings: number }
}

interface AccountCardProps {
  account: Account
  onDelete: (id: string) => void
  onSync: (id: string) => void
}

export function AccountCard({ account, onDelete, onSync }: AccountCardProps) {
  const [syncing, setSyncing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const lastSync = account.syncLogs[0]

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync(account.id)
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Remove "${account.label}"? This will delete all synced data.`)) return
    setDeleting(true)
    try {
      await onDelete(account.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-700/40 bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PlatformPill platform={account.platform} />
            <h3 className="truncate text-sm font-semibold text-gray-200">{account.label}</h3>
            {account.isActive ? (
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
            )}
          </div>

          <div className="mt-3 flex gap-6">
            <div>
              <p className="text-lg font-bold text-gray-100">{account._count.orders}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Orders</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-100">{account._count.listings}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Listings</p>
            </div>
          </div>

          {lastSync && (
            <p className="mt-3 text-xs text-gray-600">
              Last sync{' '}
              <span className={lastSync.status === 'FAILED' ? 'text-red-500' : 'text-gray-500'}>
                {lastSync.status === 'SUCCESS' ? 'succeeded' : lastSync.status === 'FAILED' ? 'failed' : 'running'}
              </span>{' '}
              · {formatDistanceToNow(new Date(lastSync.startedAt), { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Sync
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-3 w-3" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
