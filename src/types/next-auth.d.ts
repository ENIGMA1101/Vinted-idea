import { DefaultSession } from 'next-auth'
import { SubscriptionTier, Rank } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      subscriptionTier: SubscriptionTier
      expPoints: number
      currentRank: Rank
    } & DefaultSession['user']
  }

  interface User {
    subscriptionTier: SubscriptionTier
    expPoints: number
    currentRank: Rank
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    subscriptionTier: SubscriptionTier
    expPoints: number
    currentRank: Rank
  }
}
