import { encrypt, decrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'
import { ConnectedAccount } from '@prisma/client'
import { EBAY_BASE_URL } from '@/lib/constants'

interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${EBAY_BASE_URL}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.EBAY_REDIRECT_URI!,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`eBay token exchange failed: ${err}`)
  }

  return res.json()
}

export async function refreshAccessToken(account: ConnectedAccount): Promise<string> {
  if (!account.refreshToken) throw new Error('No refresh token stored')

  const refreshToken = decrypt(account.refreshToken)
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${EBAY_BASE_URL}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`eBay token refresh failed: ${err}`)
  }

  const data: TokenResponse = await res.json()
  const expiresAt = new Date(Date.now() + data.expires_in * 1000)

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessToken: encrypt(data.access_token),
      tokenExpiresAt: expiresAt,
      ...(data.refresh_token ? { refreshToken: encrypt(data.refresh_token) } : {}),
    },
  })

  return data.access_token
}

export async function getValidAccessToken(account: ConnectedAccount): Promise<string> {
  const expiresAt = account.tokenExpiresAt
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

  if (!expiresAt || expiresAt < fiveMinutesFromNow) {
    return refreshAccessToken(account)
  }

  return decrypt(account.accessToken)
}

export async function getEbayUserInfo(accessToken: string): Promise<{ userId: string; username: string }> {
  const res = await fetch(`${EBAY_BASE_URL}/commerce/identity/v1/user/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) throw new Error('Failed to get eBay user info')

  const data = await res.json()
  return { userId: data.userId, username: data.username }
}
