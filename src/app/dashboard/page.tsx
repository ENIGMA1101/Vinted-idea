import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ShoppingBag, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ExpProgress } from '@/components/dashboard/ExpProgress'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { startOfDay } from 'date-fns'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  })
  const accountIds = accounts.map((a) => a.id)

  const today = startOfDay(new Date())

  const [todayOrders, pendingCount, recentOrders, user] = await Promise.all([
    prisma.order.findMany({
      where: {
        connectedAccountId: { in: accountIds },
        platformCreatedAt: { gte: today },
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.order.count({
      where: {
        connectedAccountId: { in: accountIds },
        status: { in: ['NEW', 'PAID'] },
      },
    }),
    prisma.order.findMany({
      where: { connectedAccountId: { in: accountIds } },
      orderBy: { platformCreatedAt: 'desc' },
      take: 8,
      include: { connectedAccount: { select: { label: true } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { expPoints: true, currentRank: true, name: true },
    }),
  ])

  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-100">
          Good {getGreeting()},{' '}
          <span className="text-gray-300">{user?.name ?? session.user.email?.split('@')[0]}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's your selling summary for today.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's orders"
          value={todayOrders.length}
          icon={ShoppingBag}
          accent
        />
        <StatCard
          label="Today's revenue"
          value={`£${todayRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          label="Pending fulfilment"
          value={pendingCount}
          sub="Need action"
          icon={Clock}
        />
        <StatCard
          label="Connected accounts"
          value={accounts.length}
          icon={TrendingUp}
        />
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <ActivityFeed
              items={recentOrders.map((o) => ({
                ...o,
                total: Number(o.total),
              }))}
            />
          </Card>
        </div>

        {/* Rank & EXP */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            {user && (
              <div className="space-y-4">
                <ExpProgress expPoints={user.expPoints} currentRank={user.currentRank} />
                <div className="rounded-lg bg-gray-800/40 p-3 text-xs text-gray-500">
                  <p className="font-medium text-gray-400">Earn XP by completing orders</p>
                  <p className="mt-0.5">Each completed order awards 100 XP + 10% of order value</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
