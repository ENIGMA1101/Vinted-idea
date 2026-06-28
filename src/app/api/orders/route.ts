import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') as 'active' | 'completed' | null
  const sort = searchParams.get('sort') ?? 'recent'
  const platform = searchParams.get('platform')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  })
  const accountIds = accounts.map((a) => a.id)

  const activeStatuses: OrderStatus[] = ['NEW', 'PAID', 'SHIPPED']
  const completedStatuses: OrderStatus[] = ['COMPLETED', 'CANCELLED']

  const where: Prisma.OrderWhereInput = {
    connectedAccountId: { in: accountIds },
    ...(status === 'active' ? { status: { in: activeStatuses } } : {}),
    ...(status === 'completed' ? { status: { in: completedStatuses } } : {}),
    ...(platform ? { platform: platform as 'EBAY' } : {}),
  }

  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sort === 'oldest'
      ? { platformCreatedAt: 'asc' }
      : sort === 'platform'
      ? { platform: 'asc' }
      : { platformCreatedAt: 'desc' }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        connectedAccount: { select: { label: true, platform: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  const serialized = orders.map((o) => ({
    ...o,
    total: Number(o.total),
  }))

  return NextResponse.json({ orders: serialized, total, page, limit })
}
