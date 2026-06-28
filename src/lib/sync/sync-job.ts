import { prisma } from '@/lib/prisma'
import { EbayAdapter } from '@/lib/platform/ebay/adapter'
import { computeRank, expForOrder } from '@/lib/exp'
import { ConnectedAccount, OrderStatus } from '@prisma/client'

export async function syncAccount(account: ConnectedAccount): Promise<void> {
  const log = await prisma.syncLog.create({
    data: {
      connectedAccountId: account.id,
      syncType: 'FULL',
      status: 'RUNNING',
    },
  })

  let ordersSynced = 0
  let listingsSynced = 0
  let apiCallsUsed = 0

  try {
    const adapter = new EbayAdapter(account)

    const lastSync = await prisma.syncLog.findFirst({
      where: { connectedAccountId: account.id, status: 'SUCCESS' },
      orderBy: { startedAt: 'desc' },
    })

    // Fetch orders
    const orders = await adapter.fetchOrders({
      since: lastSync?.startedAt,
    })
    apiCallsUsed++

    for (const order of orders) {
      const existing = await prisma.order.findUnique({
        where: {
          connectedAccountId_externalOrderId: {
            connectedAccountId: account.id,
            externalOrderId: order.externalOrderId,
          },
        },
      })

      const wasCompleted = existing?.status === 'COMPLETED'
      const isNowCompleted = order.status === 'COMPLETED'

      await prisma.order.upsert({
        where: {
          connectedAccountId_externalOrderId: {
            connectedAccountId: account.id,
            externalOrderId: order.externalOrderId,
          },
        },
        create: {
          connectedAccountId: account.id,
          platform: order.platform,
          externalOrderId: order.externalOrderId,
          status: order.status,
          total: order.total,
          currency: order.currency,
          buyerUsername: order.buyerUsername,
          buyerEmail: order.buyerEmail,
          itemTitle: order.itemTitle,
          itemCount: order.itemCount,
          shippingAddress: order.shippingAddress as object,
          platformCreatedAt: order.platformCreatedAt,
          completedAt: order.completedAt,
          syncedAt: new Date(),
        },
        update: {
          status: order.status,
          completedAt: order.completedAt,
          syncedAt: new Date(),
        },
      })

      // Award EXP for newly completed orders
      if (!wasCompleted && isNowCompleted) {
        await awardExpForOrder(account.userId, order.total)
      }

      ordersSynced++
    }

    // Fetch listings
    const listings = await adapter.fetchListings()
    apiCallsUsed++

    for (const listing of listings) {
      await prisma.listing.upsert({
        where: {
          connectedAccountId_externalListingId: {
            connectedAccountId: account.id,
            externalListingId: listing.externalListingId,
          },
        },
        create: {
          connectedAccountId: account.id,
          platform: listing.platform,
          externalListingId: listing.externalListingId,
          title: listing.title,
          price: listing.price,
          currency: listing.currency,
          status: listing.status,
          quantity: listing.quantity,
          quantitySold: listing.quantitySold,
          category: listing.category,
          imageUrl: listing.imageUrl,
          viewCount: listing.viewCount,
          watchCount: listing.watchCount,
          platformCreatedAt: listing.platformCreatedAt,
          syncedAt: new Date(),
        },
        update: {
          status: listing.status,
          quantity: listing.quantity,
          quantitySold: listing.quantitySold,
          viewCount: listing.viewCount,
          watchCount: listing.watchCount,
          syncedAt: new Date(),
        },
      })
      listingsSynced++
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: 'SUCCESS',
        ordersSynced,
        listingsSynced,
        apiCallsUsed,
        completedAt: new Date(),
      },
    })
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        ordersSynced,
        listingsSynced,
        apiCallsUsed,
        errorMessage: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      },
    })
    throw err
  }
}

export async function syncAllAccounts(userId?: string): Promise<void> {
  const accounts = await prisma.connectedAccount.findMany({
    where: { isActive: true, ...(userId ? { userId } : {}) },
  })

  for (const account of accounts) {
    try {
      await syncAccount(account)
    } catch (err) {
      console.error(`Sync failed for account ${account.id}:`, err)
    }
  }
}

async function awardExpForOrder(userId: string, total: number): Promise<void> {
  const exp = expForOrder(Number(total))
  const user = await prisma.user.update({
    where: { id: userId },
    data: { expPoints: { increment: exp } },
  })
  const newRank = computeRank(user.expPoints)
  if (newRank !== user.currentRank) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentRank: newRank },
    })
  }
}
