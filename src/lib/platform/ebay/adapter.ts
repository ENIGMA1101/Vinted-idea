import { ConnectedAccount, OrderStatus, ListingStatus } from '@prisma/client'
import { PlatformAdapter, PlatformOrder, PlatformListing, FetchOptions } from '@/lib/platform/adapter'
import { getValidAccessToken } from './auth'
import { RateLimitMonitor } from './rate-limit-monitor'
import { EBAY_BASE_URL } from '@/lib/constants'

function mapEbayOrderStatus(ebayStatus: string): OrderStatus {
  switch (ebayStatus?.toUpperCase()) {
    case 'AWAITING_PAYMENT': return 'NEW'
    case 'IN_CHECKOUT': return 'NEW'
    case 'PAYMENT_INITIATED': return 'NEW'
    case 'PARTIALLY_SHIPPED': return 'SHIPPED'
    case 'SHIPPED': return 'SHIPPED'
    case 'COMPLETED': return 'COMPLETED'
    case 'PAYMENT_FAILED': return 'CANCELLED'
    case 'CANCELLED': return 'CANCELLED'
    default: return 'PAID'
  }
}

function mapEbayListingStatus(ebayStatus: string): ListingStatus {
  switch (ebayStatus?.toUpperCase()) {
    case 'ACTIVE': return 'ACTIVE'
    case 'ENDED': return 'ENDED'
    case 'COMPLETED': return 'SOLD'
    default: return 'DRAFT'
  }
}

export class EbayAdapter implements PlatformAdapter {
  readonly platform = 'EBAY' as const
  private account: ConnectedAccount
  private monitor: RateLimitMonitor | null = null

  constructor(account: ConnectedAccount) {
    this.account = account
  }

  private async authorizedFetch(path: string, params?: Record<string, string>): Promise<Response> {
    const token = await getValidAccessToken(this.account)

    if (!this.monitor) {
      this.monitor = new RateLimitMonitor(this.account.id, token)
    }

    const url = new URL(`${EBAY_BASE_URL}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    return this.monitor.throttledFetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async fetchOrders(options?: FetchOptions): Promise<PlatformOrder[]> {
    const orders: PlatformOrder[] = []
    let offset = 0
    const limit = Math.min(options?.limit ?? 200, 200)

    while (true) {
      const params: Record<string, string> = {
        limit: String(limit),
        offset: String(offset),
      }

      if (options?.since) {
        params.filter = `creationdate:[${options.since.toISOString()}..${new Date().toISOString()}]`
      }

      const res = await this.authorizedFetch('/sell/fulfillment/v1/order', params)

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`eBay orders fetch failed: ${err}`)
      }

      const data = await res.json()
      const ebayOrders = data.orders ?? []

      for (const o of ebayOrders) {
        const lineItem = o.lineItems?.[0]
        orders.push({
          externalOrderId: o.orderId,
          platform: 'EBAY',
          status: mapEbayOrderStatus(o.orderFulfillmentStatus ?? o.orderPaymentStatus),
          total: parseFloat(o.pricingSummary?.total?.value ?? '0'),
          currency: o.pricingSummary?.total?.currency ?? 'GBP',
          buyerUsername: o.buyer?.username,
          buyerEmail: o.buyer?.taxIdentifier?.taxIdentifierType === 'EMAIL' ? o.buyer.taxIdentifier.taxpayerId : undefined,
          itemTitle: lineItem?.title,
          itemCount: o.lineItems?.length ?? 1,
          shippingAddress: o.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo,
          platformCreatedAt: new Date(o.creationDate),
          completedAt: o.lastModifiedDate && o.orderFulfillmentStatus === 'FULFILLED'
            ? new Date(o.lastModifiedDate)
            : undefined,
        })
      }

      if (ebayOrders.length < limit || orders.length >= (data.total ?? 0)) break
      offset += limit
    }

    return orders
  }

  async fetchListings(options?: FetchOptions): Promise<PlatformListing[]> {
    const listings: PlatformListing[] = []
    let offset = 0
    const limit = 200

    while (true) {
      const res = await this.authorizedFetch('/sell/inventory/v1/inventory_item', {
        limit: String(limit),
        offset: String(offset),
      })

      if (!res.ok) {
        if (res.status === 404) break
        const err = await res.text()
        throw new Error(`eBay listings fetch failed: ${err}`)
      }

      const data = await res.json()
      const items = data.inventoryItems ?? []

      for (const item of items) {
        listings.push({
          externalListingId: item.sku,
          platform: 'EBAY',
          title: item.product?.title ?? item.sku,
          price: parseFloat(item.availability?.shipToLocationAvailability?.quantity ?? '0'),
          currency: 'GBP',
          status: mapEbayListingStatus(item.condition ?? 'ACTIVE'),
          quantity: item.availability?.shipToLocationAvailability?.quantity ?? 1,
          quantitySold: item.availability?.shipToLocationAvailability?.allocationByFormat?.fixedPrice ?? 0,
          category: item.product?.aspects?.Category?.[0],
          imageUrl: item.product?.imageUrls?.[0],
          viewCount: 0,
          watchCount: 0,
        })
      }

      if (items.length < limit) break
      offset += limit
    }

    return listings
  }

  async getStatus(): Promise<{ connected: boolean; username?: string }> {
    try {
      const token = await getValidAccessToken(this.account)
      const res = await fetch(`${EBAY_BASE_URL}/commerce/identity/v1/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { connected: false }
      const data = await res.json()
      return { connected: true, username: data.username }
    } catch {
      return { connected: false }
    }
  }
}
