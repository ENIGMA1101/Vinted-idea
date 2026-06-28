import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { subDays, subMonths, subQuarters, startOfDay, endOfDay } from 'date-fns'

function getDateRange(range: string, from?: string, to?: string) {
  const now = new Date()
  if (range === 'custom' && from && to) {
    return { start: new Date(from), end: endOfDay(new Date(to)) }
  }
  if (range === 'week') return { start: subDays(now, 7), end: now }
  if (range === 'month') return { start: subMonths(now, 1), end: now }
  if (range === 'quarter') return { start: subQuarters(now, 1), end: now }
  return { start: subMonths(now, 1), end: now }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const range = searchParams.get('range') ?? 'month'
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const { start, end } = getDateRange(range, from, to)

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const accountIds = accounts.map((a) => a.id)

  if (accountIds.length === 0) {
    return NextResponse.json({
      ordersPerDay: [],
      revenuePerDay: [],
      revenuePerPlatform: [],
      avgOrderValue: 0,
      totalRevenue: 0,
      totalOrders: 0,
      topItems: [],
    })
  }

  const [dailyStats, platformStats, totals, topItems] = await Promise.all([
    // Per-day breakdown
    prisma.$queryRaw<Array<{ date: Date; order_count: bigint; revenue: string }>>(
      Prisma.sql`
        SELECT
          DATE(platform_created_at) AS date,
          COUNT(*)::integer          AS order_count,
          SUM(total)::text           AS revenue
        FROM orders
        WHERE connected_account_id = ANY(${accountIds}::text[])
          AND platform_created_at >= ${start}
          AND platform_created_at <= ${end}
          AND status != 'CANCELLED'
        GROUP BY DATE(platform_created_at)
        ORDER BY date ASC
      `
    ),

    // Revenue per platform
    prisma.$queryRaw<Array<{ platform: string; order_count: bigint; revenue: string }>>(
      Prisma.sql`
        SELECT
          platform,
          COUNT(*)::integer AS order_count,
          SUM(total)::text  AS revenue
        FROM orders
        WHERE connected_account_id = ANY(${accountIds}::text[])
          AND platform_created_at >= ${start}
          AND platform_created_at <= ${end}
          AND status != 'CANCELLED'
        GROUP BY platform
      `
    ),

    // Totals
    prisma.order.aggregate({
      where: {
        connectedAccountId: { in: accountIds },
        platformCreatedAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),

    // Top items
    prisma.$queryRaw<Array<{ item_title: string; order_count: bigint; revenue: string }>>(
      Prisma.sql`
        SELECT
          COALESCE(item_title, 'Unknown Item') AS item_title,
          COUNT(*)::integer                     AS order_count,
          SUM(total)::text                      AS revenue
        FROM orders
        WHERE connected_account_id = ANY(${accountIds}::text[])
          AND platform_created_at >= ${start}
          AND platform_created_at <= ${end}
          AND status != 'CANCELLED'
          AND item_title IS NOT NULL
        GROUP BY item_title
        ORDER BY SUM(total) DESC
        LIMIT 10
      `
    ),
  ])

  return NextResponse.json({
    ordersPerDay: dailyStats.map((r) => ({
      date: r.date,
      orders: Number(r.order_count),
      revenue: parseFloat(r.revenue ?? '0'),
    })),
    revenuePerPlatform: platformStats.map((r) => ({
      platform: r.platform,
      orders: Number(r.order_count),
      revenue: parseFloat(r.revenue ?? '0'),
    })),
    avgOrderValue: Number(totals._avg.total ?? 0),
    totalRevenue: Number(totals._sum.total ?? 0),
    totalOrders: totals._count,
    topItems: topItems.map((r) => ({
      title: r.item_title,
      orders: Number(r.order_count),
      revenue: parseFloat(r.revenue ?? '0'),
    })),
  })
}
