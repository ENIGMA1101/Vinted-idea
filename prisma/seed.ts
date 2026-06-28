import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays, subHours } from 'date-fns'
import { computeRank, expForOrder } from '../src/lib/exp'

const prisma = new PrismaClient()

const ITEMS = [
  'Nike Air Force 1 Low White UK10',
  'Apple AirPods Pro 2nd Gen',
  'Lego Technic Bugatti Chiron 42083',
  'Sony WH-1000XM5 Headphones Black',
  'Vintage Levi\'s 501 Jeans W32 L32',
  'Canon EOS R50 Mirrorless Camera',
  'Dyson V12 Detect Slim Cordless',
  'Nintendo Switch OLED White Edition',
  'Supreme FW22 Box Logo Hoodie L',
  'Adidas Yeezy Boost 350 V2 Cream',
  'Apple iPad Air 5th Gen 64GB WiFi',
  'IKEA KALLAX Shelf Unit White',
  'Pokémon Scarlet Violet Booster Box',
  'Rolex Submariner 116610LN Box Papers',
  'PlayStation 5 Disc Edition Bundle',
  'Fjällräven Kånken Classic Backpack',
  'Le Creuset Cast Iron Dutch Oven 26cm',
  'Apple Watch Ultra 2 Titanium',
  'Montblanc Meisterstück Fountain Pen',
  'Vintage Burberry Nova Check Scarf',
]

const BUYERS = [
  'bargain_hunter99', 'tech_deals_uk', 'fashion_finds_21', 'sneaker_collector',
  'gadget_gamer_pro', 'vintage_vibes_uk', 'thrift_king_77', 'luxury_resale',
  'quick_flip_queen', 'collectibles_hub', 'streetwear_steve', 'electronics_ellie',
]

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

function randomFrom<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function makeEbayOrderId() {
  return `${randomInt(10, 99)}-${randomInt(10000, 99999)}-${randomInt(10000, 99999)}`
}

function makeEbayListingId() {
  return String(randomInt(100000000000, 999999999999))
}

const CATEGORIES = [
  'Clothing, Shoes & Accessories',
  'Consumer Electronics',
  'Collectibles',
  'Sporting Goods',
  'Toys & Hobbies',
  'Home & Garden',
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.syncLog.deleteMany()
  await prisma.order.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.connectedAccount.deleteMany()
  await prisma.user.deleteMany()

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12)
  const user = await prisma.user.create({
    data: {
      email: 'demo@reseller.com',
      passwordHash,
      name: 'Alex Demo',
    },
  })
  console.log(`✅ Created user: ${user.email}`)

  // Create a fake connected eBay account (no real tokens needed for seed data)
  const account = await prisma.connectedAccount.create({
    data: {
      userId: user.id,
      platform: 'EBAY',
      label: 'My Main eBay Store',
      externalUserId: 'sandbox_user_001',
      // Placeholder encrypted token — seed data doesn't use real API calls
      accessToken: 'seed:seed:seed',
      refreshToken: 'seed:seed:seed',
      tokenExpiresAt: new Date('2099-01-01'),
      isActive: true,
    },
  })

  const account2 = await prisma.connectedAccount.create({
    data: {
      userId: user.id,
      platform: 'EBAY',
      label: 'Vintage Finds Store',
      externalUserId: 'sandbox_user_002',
      accessToken: 'seed:seed:seed',
      refreshToken: 'seed:seed:seed',
      tokenExpiresAt: new Date('2099-01-01'),
      isActive: true,
    },
  })
  console.log(`✅ Created 2 connected accounts`)

  // Generate orders over last 90 days
  const statuses = ['NEW', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'] as const
  const statusWeights = [0.05, 0.1, 0.2, 0.6, 0.05] // mostly completed for realistic stats

  let totalExpPoints = 0
  const allAccounts = [account, account2]

  for (let i = 0; i < 80; i++) {
    const daysAgo = randomInt(0, 90)
    const hoursAgo = randomInt(0, 23)
    const date = subHours(subDays(new Date(), daysAgo), hoursAgo)
    const item = randomFrom(ITEMS)
    const price = parseFloat(randomBetween(8, 180).toFixed(2))
    const acct = randomFrom(allAccounts)

    // Weighted status pick
    const rand = Math.random()
    let cumulative = 0
    let status = statuses[3]
    for (let s = 0; s < statuses.length; s++) {
      cumulative += statusWeights[s]
      if (rand < cumulative) { status = statuses[s]; break }
    }

    const completedAt = status === 'COMPLETED' ? subHours(date, randomInt(24, 72)) : null

    await prisma.order.create({
      data: {
        connectedAccountId: acct.id,
        platform: 'EBAY',
        externalOrderId: makeEbayOrderId(),
        status,
        total: price,
        currency: 'GBP',
        buyerUsername: randomFrom(BUYERS),
        itemTitle: item,
        itemCount: 1,
        platformCreatedAt: date,
        completedAt,
        syncedAt: new Date(),
      },
    })

    if (status === 'COMPLETED') {
      totalExpPoints += expForOrder(price)
    }
  }
  console.log(`✅ Created 80 orders`)

  // Generate 20 listings
  const listingStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ENDED', 'SOLD'] as const

  for (let i = 0; i < 20; i++) {
    const acct = randomFrom(allAccounts)
    await prisma.listing.create({
      data: {
        connectedAccountId: acct.id,
        platform: 'EBAY',
        externalListingId: makeEbayListingId(),
        title: randomFrom(ITEMS),
        price: parseFloat(randomBetween(10, 200).toFixed(2)),
        currency: 'GBP',
        status: randomFrom(listingStatuses),
        quantity: randomInt(1, 5),
        quantitySold: randomInt(0, 10),
        category: randomFrom(CATEGORIES),
        viewCount: randomInt(10, 500),
        watchCount: randomInt(0, 50),
        platformCreatedAt: subDays(new Date(), randomInt(1, 60)),
        syncedAt: new Date(),
      },
    })
  }
  console.log(`✅ Created 20 listings`)

  // Create a sync log entry
  await prisma.syncLog.create({
    data: {
      connectedAccountId: account.id,
      syncType: 'FULL',
      status: 'SUCCESS',
      ordersSynced: 60,
      listingsSynced: 15,
      apiCallsUsed: 5,
      completedAt: subHours(new Date(), 1),
    },
  })

  // Award accumulated EXP to user
  const finalRank = computeRank(totalExpPoints)
  await prisma.user.update({
    where: { id: user.id },
    data: { expPoints: totalExpPoints, currentRank: finalRank },
  })
  console.log(`✅ User EXP: ${totalExpPoints} → Rank: ${finalRank}`)

  console.log('\n✨ Seed complete!')
  console.log('   Login: demo@reseller.com / password123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
