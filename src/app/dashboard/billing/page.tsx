'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

const PLANS = [
  {
    tier: 'FREE',
    name: 'Free',
    price: '£0',
    accounts: 1,
    features: ['1 connected account', 'Order syncing', 'Basic dashboard'],
  },
  {
    tier: 'STARTER',
    name: 'Starter',
    price: '£9.99',
    accounts: 3,
    features: ['3 connected accounts', 'Order & listing sync', 'Analytics', 'Priority support'],
    recommended: true,
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: '£29.99',
    accounts: 10,
    features: ['10 connected accounts', 'Everything in Starter', 'Advanced analytics', 'Webhook sync'],
  },
  {
    tier: 'BUSINESS',
    name: 'Business',
    price: '£79.99',
    accounts: 50,
    features: ['50 connected accounts', 'Everything in Pro', 'Dedicated support', 'Custom integrations'],
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)

  const currentTier = session?.user?.subscriptionTier ?? 'FREE'

  const handleUpgrade = async (tier: string) => {
    if (tier === 'FREE') return
    setLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  const handleManage = async () => {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Current plan: <span className="font-medium text-accent-light">{currentTier}</span>
        </p>
      </div>

      {currentTier !== 'FREE' && (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Manage subscription</CardTitle>
          </CardHeader>
          <p className="mb-4 text-xs text-gray-500">
            Change plan, update payment method, or cancel your subscription.
          </p>
          <Button variant="secondary" onClick={handleManage} loading={loading === 'portal'}>
            Open billing portal
          </Button>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.tier
          return (
            <div
              key={plan.tier}
              className={`relative rounded-xl border p-5 transition-all ${
                plan.recommended
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-gray-700/40 bg-card'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Zap className="h-2.5 w-2.5" /> Popular
                  </span>
                </div>
              )}

              <h3 className="text-sm font-bold text-gray-100">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-100">{plan.price}</span>
                {plan.tier !== 'FREE' && <span className="text-xs text-gray-500">/mo</span>}
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <div className="rounded-lg border border-gray-700/40 bg-gray-800/40 py-2 text-center text-xs font-medium text-gray-400">
                    Current plan
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.recommended ? 'primary' : 'secondary'}
                    onClick={() => handleUpgrade(plan.tier)}
                    loading={loading === plan.tier}
                    disabled={plan.tier === 'FREE'}
                  >
                    {plan.tier === 'FREE' ? 'Free plan' : 'Upgrade'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
