# 🍻 De Tre Alkoholikere

A mobile-first tasting app for rating alcohol — beer, wine, vermouth, spirits and
more. Built for Emil, Frederik & Søren to score drinks, keep tasting notes, and
crown winners across tasting evenings.

Originally a beer-tasting spreadsheet — now a proper app. The **137 historical
beer reviews** (46 beers across 4 evenings) are imported and live in the app.

## Stack

- **Next.js 15** (App Router, TypeScript) — deployed on **Vercel**
- **Tailwind CSS** — dark, mobile-first "pub" theme
- **Supabase** — Postgres + Auth + Storage (free tier)

## How it works

- **Login** is a single shared password (one Supabase account everyone uses).
  After logging in you tap **who you are** (Emil / Frederik / Søren), remembered
  on your device.
- The **home screen** is a grid of alcohol categories. Each category has its own
  space with three tabs:
  - **Rangliste** — all-time leaderboard, searchable & filterable by style
  - **Aftener** — tasting evenings; add drinks and rate them live at the table
  - **Statistik** — harshest critic, most generous, best styles, averages
- **Scoring** is a single 0–5 score (0.5 steps) plus taste/aroma/colour notes and
  optional bonus points — matching the original spreadsheet. Group averages
  ("GNS") are computed automatically.
- **Photos** of bottles/labels can be attached to any drink.

## Data model

| Table | Purpose |
|-------|---------|
| `categories` | Beer, Wine, Vermouth… drives home navigation; holds the per-category field schema |
| `tasters` | Emil, Frederik, Søren (+ guests) |
| `sessions` | A tasting evening ("Aften") |
| `products` | A specific drink (name, producer, ABV, category-specific `attributes` JSONB, photo) |
| `ratings` | One score per taster per product (+ notes, bonus, evening) |
| `product_averages` (view) | Auto-computed averages |

SQL lives in [`supabase/migrations`](./supabase/migrations).

### A note on security

All tables have Row Level Security. Because everyone shares **one** authenticated
account, the write policies are intentionally uniform (`authenticated` can
read/write) — every logged-in user is a trusted friend. The public anon key alone
cannot read or write; you need the shared password. Supabase's linter flags the
permissive write policies; this is by design for this app.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the anon key
npm run dev
```

### Environment variables

| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yeuoloclhgkfttygkhbn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable (`sb_publishable_…`) key |
| `NEXT_PUBLIC_SHARED_EMAIL` | `app@detrealkoholikere.app` |

The shared **password** is set on the Supabase auth account (not stored in the
repo). Change it from the Supabase dashboard → Authentication → Users.
