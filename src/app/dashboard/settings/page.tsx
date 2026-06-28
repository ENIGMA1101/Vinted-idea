'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ExpProgress } from '@/components/dashboard/ExpProgress'
import { Rank } from '@prisma/client'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userStats, setUserStats] = useState<{ expPoints: number; currentRank: Rank } | null>(null)

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name)
    fetch('/api/user')
      .then((r) => r.json())
      .then((d) => setUserStats({ expPoints: d.expPoints, currentRank: d.currentRank }))
  }, [session])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="name"
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            id="email"
            label="Email"
            value={session?.user?.email ?? ''}
            disabled
            className="opacity-60"
          />
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={saving}>
              Save changes
            </Button>
            {saved && <span className="text-xs text-emerald-400">Saved!</span>}
          </div>
        </form>
      </Card>

      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <ExpProgress expPoints={userStats.expPoints} currentRank={userStats.currentRank} />
          <p className="mt-3 text-xs text-gray-600">
            XP is earned automatically when orders are fulfilled. Keep selling to advance your rank.
          </p>
        </Card>
      )}
    </div>
  )
}
