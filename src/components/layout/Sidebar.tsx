'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  BarChart3,
  Store,
  Settings,
  CreditCard,
  Zap,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/listings', label: 'Listings', icon: Tag },
  { href: '/dashboard/stats', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Store },
]

const bottomItems = [
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-gray-800/60 bg-[#0d1120]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-800/60 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/30">
          <Zap className="h-4 w-4 text-accent-light" />
        </div>
        <span className="font-semibold tracking-tight text-gray-100">ResellerHub</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(href, exact)
                ? 'bg-accent/15 text-accent-light'
                : 'text-gray-500 hover:bg-[#1a2035] hover:text-gray-300'
            )}
          >
            <Icon
              className={clsx(
                'h-4 w-4 flex-shrink-0',
                isActive(href, exact) ? 'text-accent-light' : 'text-gray-600'
              )}
            />
            {label}
          </Link>
        ))}

        <div className="mt-auto">
          <div className="my-3 border-t border-gray-800/60" />
          {bottomItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-accent/15 text-accent-light'
                  : 'text-gray-500 hover:bg-[#1a2035] hover:text-gray-300'
              )}
            >
              <Icon
                className={clsx(
                  'h-4 w-4 flex-shrink-0',
                  isActive(href) ? 'text-accent-light' : 'text-gray-600'
                )}
              />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  )
}
