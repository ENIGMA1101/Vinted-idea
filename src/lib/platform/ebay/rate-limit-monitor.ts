import { EBAY_BASE_URL } from '@/lib/constants'

interface RateLimitEntry {
  apiContext: string
  apiVersion: string
  apiName: string
  resources: Array<{
    name: string
    rates: Array<{
      limit: number
      remaining: number
      reset: string
      timeWindow: number
    }>
  }>
}

interface RateLimitCache {
  data: RateLimitEntry[]
  fetchedAt: Date
}

const cache = new Map<string, RateLimitCache>()
const CACHE_TTL_MS = 60_000

export class RateLimitMonitor {
  private accountId: string
  private accessToken: string

  constructor(accountId: string, accessToken: string) {
    this.accountId = accountId
    this.accessToken = accessToken
  }

  async getRateLimits(): Promise<RateLimitEntry[]> {
    const cached = cache.get(this.accountId)
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
      return cached.data
    }

    try {
      const res = await fetch(`${EBAY_BASE_URL}/sell/analytics/v1/rate_limit`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })

      if (!res.ok) return []

      const data = await res.json()
      const limits = data.rateLimits ?? []
      cache.set(this.accountId, { data: limits, fetchedAt: new Date() })
      return limits
    } catch {
      return []
    }
  }

  async canMakeCall(apiName: string): Promise<boolean> {
    const limits = await this.getRateLimits()
    const entry = limits.find((l) => l.apiName === apiName)
    if (!entry) return true

    for (const resource of entry.resources) {
      for (const rate of resource.rates) {
        if (rate.remaining <= 0) return false
        if (rate.remaining < rate.limit * 0.05) {
          await this.waitForWindow(rate.timeWindow)
        }
      }
    }

    return true
  }

  private waitForWindow(seconds: number): Promise<void> {
    const waitMs = Math.min(seconds * 1000, 30_000)
    return new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  async throttledFetch(url: string, options: RequestInit): Promise<Response> {
    const apiName = new URL(url).pathname.split('/')[3] ?? 'unknown'
    const canCall = await this.canMakeCall(apiName)

    if (!canCall) {
      throw new Error(`Rate limit reached for ${apiName}. Sync paused to protect quota.`)
    }

    return fetch(url, options)
  }
}
