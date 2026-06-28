import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'
import Stripe from 'stripe'

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_PRICE_STARTER ?? '']: 'STARTER',
  [process.env.STRIPE_PRICE_PRO ?? '']: 'PRO',
  [process.env.STRIPE_PRICE_BUSINESS ?? '']: 'BUSINESS',
}

async function getTierFromSubscription(sub: Stripe.Subscription): Promise<SubscriptionTier> {
  const priceId = sub.items.data[0]?.price.id ?? ''
  return PRICE_TO_TIER[priceId] ?? 'FREE'
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const cs = event.data.object as Stripe.CheckoutSession
      if (cs.mode === 'subscription' && cs.subscription && cs.customer) {
        const sub = await stripe.subscriptions.retrieve(cs.subscription as string)
        const tier = await getTierFromSubscription(sub)
        await prisma.user.updateMany({
          where: { stripeCustomerId: cs.customer as string },
          data: { subscriptionTier: tier, subscriptionId: sub.id },
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tier = await getTierFromSubscription(sub)
      await prisma.user.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { subscriptionTier: tier, subscriptionId: sub.id },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { subscriptionTier: 'FREE', subscriptionId: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
