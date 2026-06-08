# CLAUDE.md

Guidance for working in this repository.

## What this is

**De Tre Alkoholikere** — a mobile-first tasting app for rating alcohol (beer,
wine, vermouth, spirits…) used by three friends (Emil, Frederik, Søren). It
started as a beer-tasting spreadsheet; the 137 historical beer reviews are
imported into the database.

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind, deployed on Vercel.
- **Backend:** Supabase (Postgres + Auth + Storage), free tier.
- **UI language is Danish.** Keep user-facing strings in Danish; code/comments in English.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build — run this before pushing UI/logic changes
npm run lint     # next lint
```

There is no test suite. Verify changes with `npm run build` (catches type errors)
and, when relevant, by smoke-testing `npm run start` locally.

## Supabase project

- Project ref: `yeuoloclhgkfttygkhbn` (name "De-Tre-Alkoholikere", region eu-central-2).
- Use the Supabase MCP tools for schema/data work. Prefer `apply_migration` for
  DDL and `execute_sql` for data. Run `get_advisors` after schema changes.
- SQL is mirrored in [`supabase/migrations/`](./supabase/migrations) — keep these
  in sync with what's applied to the remote project.

## Data model

| Table | Notes |
|-------|-------|
| `categories` | Slug PK (`beer`, `vermouth`, …). Drives the home grid. `attribute_schema` (JSONB) is an array of `{key,label,type,options?}` that **dynamically renders the per-category fields** in the add-drink form. |
| `tasters` | Emil, Frederik, Søren (+ guests). |
| `sessions` | A tasting evening ("Aften"), belongs to a category. |
| `products` | A drink: name, producer, abv (percent), category-specific `attributes` JSONB (e.g. `{style,color}`), `photo_url`. |
| `ratings` | One row per `(product_id, taster_id)` — enforced unique. Holds `score` (0–5), `extra_points`, and `taste_note`/`aroma_note`/`color_note`. Optionally linked to a `session_id`. |
| `product_averages` (view) | Auto-computed `avg_score` / `avg_total` ("GNS"). `security_invoker = on`. |

A product belongs to a session implicitly: it appears in a session once it has a
rating with that `session_id`.

## Auth & access model (important)

- **One shared Supabase account** (`app@detrealkoholikere.app`) that everyone logs
  into with a shared password on `/login`. Change the password via Supabase
  dashboard → Authentication → Users.
- After login, the user picks **who they are** (a `taster`); this is stored in
  `localStorage` (`dta_current_taster`) via `TasterProvider`, not in auth.
- RLS: every table allows **`authenticated` to read and write** (`using(true)`).
  This is intentional — all logged-in users are trusted friends. Supabase's linter
  flags the permissive write policies; do not "fix" them. The public anon key
  alone cannot read/write.
- `middleware.ts` gates all routes: no session → redirect to `/login`.

### Gotcha: data fetches depend on the auth session

Client components fetch via the browser Supabase client. The `TasterProvider`
mounts on `/login` while still unauthenticated, so it **reloads tasters on
`onAuthStateChange`** — don't revert that to a one-shot fetch or the "who are you"
picker goes empty after login.

## Config

`lib/config.ts` holds `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SHARED_EMAIL` with
**baked-in public defaults**, overridable by `NEXT_PUBLIC_*` env vars. These are
public values (the publishable/anon key ships to the browser anyway), so the app
deploys to Vercel with zero env configuration. Always import config from here —
don't read `process.env.NEXT_PUBLIC_*` directly in components.

## Code map

```
app/
  login/page.tsx                     shared-password gate
  page.tsx                           home: category grid
  c/[category]/
    layout.tsx                       category header + tabs (Rangliste/Aftener/Statistik)
    page.tsx                         leaderboard (search + style filter)
    sessions/page.tsx                list + create evenings
    sessions/[id]/page.tsx           live tasting: add drinks, rate
    products/[id]/page.tsx           per-taster breakdown + notes
    stats/page.tsx                   dashboard, filterable per person
components/
  TasterProvider.tsx                 tasters list + current taster (localStorage)
  TopBar.tsx, Sheet.tsx, ScoreBadge.tsx, ScoreSlider.tsx,
  RatingForm.tsx, AddDrinkForm.tsx
lib/
  supabase/{client,server,middleware}.ts
  config.ts, types.ts, data.ts, format.ts
```

## Conventions

- **Scoring** is a single 0–5 score in **0.5 steps**, plus free-text taste/aroma/
  colour notes and optional bonus points — this mirrors the original spreadsheet.
  Don't introduce separate sub-scores without asking.
- Stars render as a gold `★` **CSS-clipped to the fill %** over a grey `★`
  (`ScoreSlider`'s `Stars`). Don't use half-star unicode glyphs — they render
  inconsistently on iOS.
- Score colours come from `scoreColor`/`scoreBg` in `lib/format.ts`.
- Dark, mobile-first "pub" theme; amber accent; max content width `max-w-2xl`.
- Most pages are client components (`"use client"`) fetching on mount.

## Deploy

- Vercel deploys from `main` via Git integration. `main` and the working branch
  are kept in sync.
- `vercel.json` pins `framework: nextjs` (without it, Vercel mis-detected the app
  as static and failed looking for a `public/` output dir).
- If a Vercel `.vercel.app` URL returns 403 to automated fetchers, that's edge
  bot-filtering, not necessarily a real outage — real browsers work. Genuine
  access blocks are usually Vercel Deployment Protection (Settings → Deployment
  Protection).
