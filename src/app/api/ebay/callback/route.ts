import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { exchangeCodeForTokens, getEbayUserInfo } from '@/lib/platform/ebay/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/accounts?error=ebay_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/accounts?error=invalid_callback`)
  }

  // Validate state
  const oauthState = await prisma.oAuthState.findUnique({ where: { state } })
  if (!oauthState || oauthState.expiresAt < new Date()) {
    await prisma.oAuthState.deleteMany({ where: { state } })
    return NextResponse.redirect(`${appUrl}/dashboard/accounts?error=state_expired`)
  }

  await prisma.oAuthState.delete({ where: { state } })

  try {
    const tokens = await exchangeCodeForTokens(code)
    const userInfo = await getEbayUserInfo(tokens.access_token).catch(() => null)

    await prisma.connectedAccount.upsert({
      where: {
        userId_platform_externalUserId: {
          userId: oauthState.userId,
          platform: 'EBAY',
          externalUserId: userInfo?.userId ?? 'unknown',
        },
      },
      create: {
        userId: oauthState.userId,
        platform: 'EBAY',
        label: oauthState.label,
        externalUserId: userInfo?.userId ?? 'unknown',
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true,
      },
      update: {
        label: oauthState.label,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true,
      },
    })

    return NextResponse.redirect(`${appUrl}/dashboard/accounts?connected=true`)
  } catch (err) {
    console.error('eBay callback error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/accounts?error=token_exchange_failed`)
  }
}
