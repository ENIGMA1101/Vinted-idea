import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncAccount, syncAllAccounts } from '@/lib/sync/sync-job'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Allow Vercel cron (no session) via secret header, or authenticated users
  const cronSecret = req.headers.get('x-cron-secret')
  const isCron = cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const accountId = body?.accountId

    if (accountId) {
      const account = await prisma.connectedAccount.findFirst({
        where: { id: accountId, userId: session.user.id },
      })
      if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

      await syncAccount(account)
      return NextResponse.json({ success: true, synced: [accountId] })
    }

    await syncAllAccounts(session.user.id)
    return NextResponse.json({ success: true })
  }

  // Cron: sync all active accounts
  await syncAllAccounts()
  return NextResponse.json({ success: true })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const accountIds = accounts.map((a) => a.id)

  const logs = await prisma.syncLog.findMany({
    where: { connectedAccountId: { in: accountIds } },
    orderBy: { startedAt: 'desc' },
    take: 20,
    include: { connectedAccount: { select: { label: true, platform: true } } },
  })

  return NextResponse.json(logs)
}
