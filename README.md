# ResellerHub — Multi-Account Reseller Dashboard

A dark, premium SaaS dashboard for resellers to manage multiple eBay selling accounts from one place. v1 integrates eBay only; the architecture is designed for future platform extensions.

---

## Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **App auth**: NextAuth v4 (email/password + JWT sessions)
- **Platform auth**: eBay OAuth 2.0 (tokens encrypted with AES-256-GCM)
- **Payments**: Stripe subscriptions
- **Charts**: Recharts

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-byte string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `ENCRYPTION_KEY` | 64-char hex string for token encryption |
| `EBAY_CLIENT_ID` | eBay sandbox App ID |
| `EBAY_CLIENT_SECRET` | eBay sandbox Cert ID |
| `EBAY_REDIRECT_URI` | Must match your eBay RuName exactly |
| `EBAY_RUNAME` | Your eBay Developer Portal RuName |
| `EBAY_SANDBOX` | `"true"` for sandbox, `"false"` for production |
| `STRIPE_SECRET_KEY` | Stripe test secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen --forward-to ...` |
| `STRIPE_PRICE_STARTER` | Stripe price ID for Starter plan |
| `STRIPE_PRICE_PRO` | Stripe price ID for Pro plan |
| `STRIPE_PRICE_BUSINESS` | Stripe price ID for Business plan |

Generate the encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set up the database

```bash
npm run db:migrate    # Run migrations (creates tables)
npm run db:seed       # Load demo data
```

The seed creates:
- User: `demo@reseller.com` / `password123`
- 2 connected eBay accounts
- 80 sample orders (last 90 days, various statuses)
- 20 sample listings

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → login → dashboard.

---

## Getting eBay sandbox credentials

1. Register at [developer.ebay.com](https://developer.ebay.com)
2. Go to **My Account → Application Keys**
3. Use the **Sandbox** tab — copy **App ID (Client ID)** and **Cert ID (Client Secret)**
4. Under **User Tokens**, create a **RuName** — set the redirect URI to:
   ```
   http://localhost:3000/api/ebay/callback
   ```
5. Copy the RuName string into `EBAY_RUNAME`

You'll need a sandbox buyer/seller account to test the OAuth flow. Create one at [developer.ebay.com/sandbox/register](https://developer.ebay.com/sandbox/register).

---

## Architecture

### Background sync (no live eBay calls on page views)

The dashboard always reads from the local PostgreSQL database — never from eBay directly on a page view.

Data flows:
1. **Sync trigger** → `POST /api/sync` (manual or via cron)
2. **EbayAdapter** fetches orders/listings from eBay API
3. **RateLimitMonitor** checks `GET /sell/analytics/v1/rate_limit` before each call and self-throttles when approaching limits (5,000 calls/day default)
4. Results are upserted into `orders` and `listings` tables
5. Dashboard pages read from DB — a page refresh costs zero eBay API calls

### Platform adapter interface

New platforms are added by implementing `PlatformAdapter`:

```typescript
interface PlatformAdapter {
  readonly platform: Platform
  fetchOrders(options?: FetchOptions): Promise<PlatformOrder[]>
  fetchListings(options?: FetchOptions): Promise<PlatformListing[]>
  getStatus(): Promise<{ connected: boolean; username?: string }>
}
```

Currently implemented: `EbayAdapter`.

### Sync scheduling

**Development**: trigger manually via the Sync button on each account card, or:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-cron-secret: $CRON_SECRET"
```

**Vercel (Pro)**: `vercel.json` configures a cron every 6 hours.

**External cron**: Point any cron service at `POST /api/sync` with the `x-cron-secret` header.

### EXP / rank system

EXP is earned only from real sales outcomes — never from logins or clicks.

| Event | EXP awarded |
|---|---|
| Order completed | 100 + ⌊order_total × 0.1⌋ |

Rank thresholds:

| Rank | Min XP |
|---|---|
| Bronze | 0 |
| Silver | 1,000 |
| Gold | 5,000 |
| Platinum | 20,000 |
| Diamond | 100,000 |

Rank is displayed as a small coloured badge beside the user's name in the top bar.

---

## Stripe setup

1. Create products + monthly prices in your Stripe dashboard for Starter, Pro, Business
2. Copy the price IDs into `.env.local`
3. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

Events handled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

---

## Subscription tiers

| Tier | Connected accounts | Price |
|---|---|---|
| Free | 1 | £0 |
| Starter | 3 | £9.99/mo |
| Pro | 10 | £29.99/mo |
| Business | 50 | £79.99/mo |

---

## Deployment (Vercel + Neon/Railway)

1. Create a PostgreSQL database on [Neon](https://neon.tech) or [Railway](https://railway.app)
2. Push to GitHub and import into Vercel
3. Add all environment variables in Vercel project settings
4. Run migrations against the production DB:
   ```bash
   DATABASE_URL="..." npx prisma migrate deploy
   ```
5. (Optional) Enable Vercel Pro for cron support

---

## Design

- **Background**: `#0f1117` (dark charcoal with blue-grey tint)
- **Cards**: `#161b27`
- **Accent**: `#7c3aed` (violet / electric indigo)
- **Font**: Inter
- Semantic colours: emerald (success), amber (pending), red (cancelled)
- Rank colours: bronze, silver, gold, platinum, diamond — all harmonious on the dark background
