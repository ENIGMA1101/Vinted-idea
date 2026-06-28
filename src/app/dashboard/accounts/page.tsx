'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Store } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AccountCard } from '@/components/accounts/AccountCard'
import { Spinner } from '@/components/ui/Spinner'

interface Account {
  id: string
  label: string
  platform: 'EBAY'
  isActive: boolean
  createdAt: string
  syncLogs: Array<{ status: string; startedAt: string; completedAt: string | null }>
  _count: { orders: number; listings: number }
}

function AccountsBanner() {
  const params = useSearchParams()
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (params.get('connected') === 'true') {
      setBanner({ type: 'success', message: 'eBay account connected successfully!' })
    } else if (params.get('error')) {
      const errMap: Record<string, string> = {
        ebay_denied: 'eBay authorisation was denied.',
        state_expired: 'Connection expired. Please try again.',
        token_exchange_failed: 'Failed to exchange tokens. Check your eBay app credentials.',
        invalid_callback: 'Invalid callback. Please try again.',
      }
      setBanner({ type: 'error', message: errMap[params.get('error')!] ?? 'Connection failed.' })
    }
  }, [params])

  if (!banner) return null

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        banner.type === 'success'
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          : 'border-red-500/20 bg-red-500/10 text-red-400'
      }`}
    >
      {banner.message}
    </div>
  )
}

function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [label, setLabel] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const fetchAccounts = async () => {
    const res = await fetch('/api/accounts')
    const data = await res.json()
    setAccounts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchAccounts() }, [])

  const handleConnect = async () => {
    if (!label.trim()) return
    setError('')
    setConnecting(true)
    try {
      const res = await fetch('/api/ebay/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchAccounts()
  }

  const handleSync = async (id: string) => {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: id }),
    })
    await fetchAccounts()
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Connected Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your eBay selling accounts.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Connect eBay
        </Button>
      </div>

      <Suspense fallback={null}>
        <AccountsBanner />
      </Suspense>

      {showForm && (
        <div className="rounded-xl border border-gray-700/40 bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-200">Connect a new eBay account</h3>
          <Input
            placeholder="e.g. My Main Store"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            label="Account label"
            className="max-w-xs"
          />
          {error && (
            <p className="mt-2 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleConnect} loading={connecting} disabled={!label.trim()}>
              Authorise with eBay
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-600">
            You&apos;ll be redirected to eBay to grant read-only access to your orders and listings.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700/50 py-20 text-center">
          <Store className="mb-3 h-10 w-10 text-gray-700" />
          <p className="text-sm font-medium text-gray-400">No accounts connected</p>
          <p className="mt-1 text-xs text-gray-600">Connect your first eBay account to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDelete={handleDelete}
              onSync={handleSync}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default function AccountsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <AccountsContent />
    </div>
  )
}
