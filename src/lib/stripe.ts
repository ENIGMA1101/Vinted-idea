import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const STRIPE_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER ?? '',
  PRO: process.env.STRIPE_PRICE_PRO ?? '',
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS ?? '',
}
