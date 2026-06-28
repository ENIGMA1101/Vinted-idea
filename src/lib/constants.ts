import { SubscriptionTier } from '@prisma/client'

export const TIER_ACCOUNT_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 1,
  STARTER: 3,
  PRO: 10,
  BUSINESS: 50,
}

export const TIER_PRICES: Record<Exclude<SubscriptionTier, 'FREE'>, string> = {
  STARTER: '£9.99/mo',
  PRO: '£29.99/mo',
  BUSINESS: '£79.99/mo',
}

export const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  FREE: '1 connected account',
  STARTER: 'Up to 3 accounts',
  PRO: 'Up to 10 accounts',
  BUSINESS: 'Up to 50 accounts',
}

export const EBAY_BASE_URL = process.env.EBAY_SANDBOX === 'true'
  ? 'https://api.sandbox.ebay.com'
  : 'https://api.ebay.com'

export const EBAY_AUTH_URL = process.env.EBAY_SANDBOX === 'true'
  ? 'https://auth.sandbox.ebay.com'
  : 'https://auth.ebay.com'

export const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
].join(' ')
