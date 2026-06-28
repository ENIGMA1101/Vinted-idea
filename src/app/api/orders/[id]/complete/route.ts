import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeRank, expForOrder } from '@/lib/exp'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      connectedAccount: { userId: session.user.id },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'COMPLETED') return NextResponse.json({ error: 'Already completed' }, { status: 400 })

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })

  // Award EXP
  const exp = expForOrder(Number(order.total))
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { expPoints: { increment: exp } },
  })
  const newRank = computeRank(user.expPoints)
  if (newRank !== user.currentRank) {
    await prisma.user.update({ where: { id: session.user.id }, data: { currentRank: newRank } })
  }

  return NextResponse.json({ ...updated, total: Number(updated.total), expAwarded: exp })
}
