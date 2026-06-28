import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TIER_ACCOUNT_LIMITS } from '@/lib/constants'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id },
    include: {
      syncLogs: {
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
      _count: { select: { orders: true, listings: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(accounts)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  const account = await prisma.connectedAccount.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  await prisma.connectedAccount.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
