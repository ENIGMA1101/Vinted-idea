'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { RankBadge } from '@/components/dashboard/RankBadge'

export function TopBar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="fixed left-60 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-800/60 bg-[#0d1120]/80 px-6 backdrop-blur-sm">
      <div />

      <div className="flex items-center gap-3">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-[#1a2035] hover:text-gray-300">
          <Bell className="h-4 w-4" />
        </button>

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-[#1a2035]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent-light">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-gray-200 leading-none">
                {session?.user?.name ?? session?.user?.email?.split('@')[0]}
              </span>
              {session?.user?.currentRank && (
                <RankBadge rank={session.user.currentRank} className="mt-0.5" />
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-gray-600" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-700/50 bg-card py-1 shadow-lg">
              <div className="border-b border-gray-700/40 px-3 py-2">
                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-400 transition-colors hover:bg-hover hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
