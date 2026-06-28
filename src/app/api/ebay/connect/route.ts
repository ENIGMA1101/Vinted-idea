import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { EBAY_AUTH_URL, EBAY_SCOPES, TIER_ACCOUNT_LIMITS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { label } = await req.json()
  if (!label?.trim()) {
    return NextResponse.json({ error: 'Account label is required' }, { status: 400 })
  }

  // Check tier limit
  const accountCount = await prisma.connectedAccount.count({
    where: { userId: session.user.id, isActive: true },
  })
  const limit = TIER_ACCOUNT_LIMITS[session.user.subscriptionTier]
  if (accountCount >= limit) {
    return NextResponse.json(
      { error: `Your ${session.user.subscriptionTier} plan allows up to ${limit} connected account(s). Upgrade to add more.` },
      { status: 403 }
    )
  }

  // Store OAuth state
  const state = randomBytes(32).toString('hex')
  await prisma.oAuthState.create({
    data: {
      userId: session.user.id,
      state,
      label: label.trim(),
      platform: 'EBAY',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  const authUrl = new URL(`${EBAY_AUTH_URL}/oauth2/authorize`)
  authUrl.searchParams.set('client_id', process.env.EBAY_CLIENT_ID!)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', process.env.EBAY_RUNAME!)
  authUrl.searchParams.set('scope', EBAY_SCOPES)
  authUrl.searchParams.set('state', state)

  return NextResponse.json({ url: authUrl.toString() })
}
