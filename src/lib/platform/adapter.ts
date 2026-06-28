import { OrderStatus, ListingStatus, Platform } from '@prisma/client'

export interface PlatformOrder {
  externalOrderId: string
  platform: Platform
  status: OrderStatus
  total: number
  currency: string
  buyerUsername?: string
  buyerEmail?: string
  itemTitle?: string
  itemCount: number
  shippingAddress?: Record<string, unknown>
  platformCreatedAt: Date
  completedAt?: Date
}

export interface PlatformListing {
  externalListingId: string
  platform: Platform
  title: string
  price: number
  currency: string
  status: ListingStatus
  quantity: number
  quantitySold: number
  category?: string
  imageUrl?: string
  viewCount: number
  watchCount: number
  platformCreatedAt?: Date
}

export interface FetchOptions {
  since?: Date
  limit?: number
}

export interface PlatformAdapter {
  readonly platform: Platform
  fetchOrders(options?: FetchOptions): Promise<PlatformOrder[]>
  fetchListings(options?: FetchOptions): Promise<PlatformListing[]>
  getStatus(): Promise<{ connected: boolean; username?: string }>
}
