# StockShare

Daily Nigerian stock market (NGX) trend tracking, predictive BUY/HOLD/SELL
signals, and portfolio-based recommendations — freemium, register-and-go.

## What's here

- **Auth** — email/password registration & login, JWT session cookie (no
  third-party auth dependency).
- **Market data** — a pluggable `DataProvider` interface with two
  implementations: a deterministic seed/demo provider (default) and a
  best-effort NGX public-price-list scraper (see caveat below).
- **Prediction engine** — a transparent SMA-crossover + momentum model that
  scores every tracked stock and explains its BUY/HOLD/SELL call in plain
  English (`src/lib/prediction.ts`).
- **Portfolio tracking** — add the shares/firms you hold, see live
  gain/loss, and a value-over-time chart backed by daily snapshots.
- **Recommendations** — generated from *your* holdings + current signals:
  buy/sell calls on positions you own, concentration/sector risk warnings,
  and new-opportunity suggestions.
- **Freemium gating** — `src/lib/entitlements.ts` is the single source of
  truth for what Free vs Premium unlocks (holdings limit, recommendation
  count, price history depth, full signal detail). `/account` has a mock
  upgrade toggle standing in for real billing.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 ·
Prisma 7 + PostgreSQL · Recharts · Zod · bcryptjs · jose.

This is a fairly new stack (Next 16, Prisma 7) with real breaking changes
from older tutorials/training data — notably: `middleware.ts` is now
`src/proxy.ts` exporting `proxy()`, route `params`/`cookies()` are async,
and Prisma 7 requires a driver adapter (`@prisma/adapter-pg` here) plus
generates its client into `src/generated/prisma`.

## Getting started

You need a Postgres database — a free local one is easiest for dev:

```bash
# macOS/Linux with Postgres installed:
createuser stockshare --pwprompt --createdb
createdb stockshare -O stockshare
```

Then:

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL (and SESSION_SECRET — see below)
npx prisma migrate dev     # applies the schema
npm run db:seed            # ~180 days of deterministic demo price history for 24 NGX tickers
npm run predict           # snapshots today's trend signal for every stock
npm run dev
```

Then register an account at `/register`. Generate a real `SESSION_SECRET`
with `openssl rand -base64 32` — don't reuse the same value across
environments, and never commit it.

### Daily operations

Run once per trading day (a cron job / Vercel Cron / GitHub Action):

```bash
npm run ingest   # fetch & store today's OHLCV bars (MARKET_DATA_PROVIDER=seed|scrape)
npm run predict  # snapshot today's trend signal per stock
```

`npm run ingest -- --backfill=N` backfills N days of **seed** data (handy
for demos/staging). `npm run ingest -- --provider=scrape` forces the NGX
scraper for one run and falls back to seed data automatically if it fails.

## ⚠️ About the NGX data source

You chose "scrape NGX/public sources" for market data. `src/lib/market/providers/ngx-scraper-provider.ts`
targets NGX's public equities price list, but **it was written without
network access to ngxgroup.com** (this sandbox's egress proxy blocks that
domain) — so the table/column detection is defensive (matches on header
text, not hard-coded indexes) but has not been run against the real page.

Before relying on it:

1. `MARKET_DATA_PROVIDER=scrape npm run ingest` and read the output.
2. If it throws "could not locate a price table", inspect the live HTML
   and adjust `HEADER_ALIASES` / `findPriceTable` in that file.
3. NGX's *official* real-time/EOD feed is a paid product
   (`marketdataapiv3.ngxgroup.com`) — worth it once you're monetizing, since
   the free public page can change shape without notice.

Until then, the default **seed provider** (`MARKET_DATA_PROVIDER=seed`,
also the default with no env var set) drives the whole app with a
realistic, reproducible random walk seeded from real NGX ticker symbols —
everything else (predictions, recommendations, portfolio math, freemium
gating) works identically once real prices are wired in, since they only
depend on the `DataProvider` interface.

## Architecture notes

- **`src/lib/market/`** — ticker list, provider interface + implementations,
  ingestion (`ingest.ts`), and read helpers (`queries.ts`) that pair each
  stock with its computed trend signal.
- **`src/lib/prediction.ts`** — pure function, `closes[] → {signal, score, rationale}`.
  No DB/network dependency, so it's easy to unit test or replace with a
  real model later.
- **`src/lib/recommendations.ts`** — reads a user's holdings + all current
  signals and produces buy/sell/diversify/concentration recommendations.
- **`src/lib/entitlements.ts`** / **`src/lib/plans.ts`** — freemium tier
  config, consumed by both server actions (enforcement) and pages (UI gating).
- **`prisma/schema.prisma`** — `User`, `Stock`, `DailyPrice`, `Holding`,
  `WatchlistItem`, `PortfolioSnapshot`, `Prediction`, `Recommendation`.

## Deploying on Vercel

The project is linked to Vercel and deploys automatically on every push to
`main`. `npm run build` runs `prisma migrate deploy` before `next build`, so
schema migrations apply automatically on each deploy — no manual migration
step needed once the env vars below are set.

To finish setup (one-time):

1. **Add a Postgres database** — Vercel dashboard → your project → *Storage*
   tab → *Create Database* → Postgres (Neon-backed), or connect your own
   Neon/Supabase project. Note both connection strings it gives you: the
   **direct/non-pooled** one (Supabase: "Direct connection" /
   `POSTGRES_URL_NON_POOLING`, port 5432) and the **pooled** one (Supabase:
   "Transaction pooler" / `POSTGRES_PRISMA_URL`, port 6543).
2. **Set env vars** — Project → *Settings* → *Environment Variables*:
   - `DATABASE_URL` — the **direct/non-pooled** connection string. Used by
     the Prisma CLI (`prisma migrate deploy`), which holds a session-level
     advisory lock that connection poolers (PgBouncer/Supavisor) don't
     support.
   - `POSTGRES_PRISMA_URL` — the **pooled** connection string. Used by the
     app at runtime (`src/lib/db.ts`); pooling matters because each
     concurrent serverless invocation opens its own connection. Falls back
     to `DATABASE_URL` if unset.
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`. Required —
     the app throws on boot without it in production.
3. **Redeploy** (Vercel does this automatically after env vars change, or
   trigger one manually from the Deployments tab). The build's
   `prisma migrate deploy` step creates all the tables on first deploy.
4. **Seed demo data** — the database starts empty (no stocks/prices), so the
   dashboard has nothing to show until you seed it. Two ways to do this:

   - **From your own machine**: pull the production env and run the seed
     scripts once:
     ```bash
     vercel env pull .env.production.local
     DATABASE_URL=<paste the production DATABASE_URL> npm run db:seed
     DATABASE_URL=<paste the production DATABASE_URL> npm run predict
     ```
   - **From the deployed app itself**: set an `ADMIN_SECRET` env var on
     Vercel (any random string — `openssl rand -hex 16`), redeploy, then
     visit `https://<your-domain>/api/admin/seed?secret=<ADMIN_SECRET>`
     once. This backfills ~180 days of deterministic demo history, snapshots
     today's trend signals, *and* makes one real attempt at scraping NGX's
     live price list for today's bar (falling back silently to demo data if
     that fails — see the data-source caveat above). Safe to re-run; every
     write is an idempotent upsert. Not meant to stay in regular use —
     remove `ADMIN_SECRET` (or don't set it) once you've seeded, and use
     scheduled ingestion (next step) going forward.
5. **Schedule daily ingestion** — add a [Vercel Cron](https://vercel.com/docs/cron-jobs)
   job (or GitHub Action) that runs `npm run ingest && npm run predict`
   after NGX market close each trading day.

## Other production notes

- **Billing**: `/account`'s upgrade button directly flips `User.tier` —
  replace `src/app/actions/account.ts` with a real Stripe/Paystack/Flutterwave
  integration (webhook sets `tier` on successful subscription).
- **Pricing page** numbers (`₦4,999/mo`) are placeholders — set real pricing
  once you've decided on a plan.

Not investment advice — the trend model is a transparent starting point,
not a guarantee of returns.
