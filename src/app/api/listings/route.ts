import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  })
  const accountIds = accounts.map((a) => a.id)

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: {
        connectedAccountId: { in: accountIds },
        ...(status ? { status: status as 'ACTIVE' | 'ENDED' | 'SOLD' | 'DRAFT' } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        connectedAccount: { select: { label: true, platform: true } },
      },
    }),
    prisma.listing.count({
      where: {
        connectedAccountId: { in: accountIds },
        ...(status ? { status: status as 'ACTIVE' | 'ENDED' | 'SOLD' | 'DRAFT' } : {}),
      },
    }),
  ])

  const serialized = listings.map((l) => ({ ...l, price: Number(l.price) }))
  return NextResponse.json({ listings: serialized, total, page, limit })
}
