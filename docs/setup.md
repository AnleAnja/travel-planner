# Travel Planner setup

Operator notes for running and deploying Travel Planner. Travelers should read the [README](../README.md) instead.

## Local app

```bash
npm install
npm run dev
```

Without environment variables the app starts in demo mode. Data is stored in the browser and synced across tabs.

## Connect Supabase

1. Create a free Supabase project in an EU region.
2. Enable anonymous sign-in under **Authentication → Providers → Anonymous**.
3. Apply migrations from `supabase/migrations`.
4. Deploy Edge Functions `join-trip` and `weather` with JWT verification off at the gateway (`--no-verify-jwt` or the `[functions.*] verify_jwt = false` entries in `config.toml`). The functions still check the user session themselves. That way the browser CORS preflight is not blocked with a header-less 401. Invite codes must be redeemed only through `join-trip`; do not grant `join_trip_with_code` to the `authenticated` or `anon` roles.
5. Copy `.env.example` to `.env.local` and fill in the public project values.

The service-role key may only be used as an Edge Function secret. Browser security comes from Row Level Security, not from hiding the publishable key.

Local `supabase start` uses [`supabase/config.toml`](../supabase/config.toml), which enables anonymous sign-ins.

## GitHub Pages

The workflow `.github/workflows/deploy-pages.yml` tests and publishes pushes to `main`. Vite bakes repository variables into the JavaScript at `npm run build`, so a deploy without them stays in demo mode even if you add them later.

In the repository:

1. Under **Settings → Pages**, set the source to **GitHub Actions**.
2. Under **Settings → Secrets and variables → Actions**, open the **Variables** tab (not Secrets). Create:
   - `VITE_SUPABASE_URL` — the project URL, for example `https://xxxx.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — the publishable (anon) key from **Supabase → Project Settings → API**
3. After adding or changing values, re-run **Actions → Test and deploy GitHub Pages** on `main`. Existing Pages artifacts do not pick up new variables until the next build.
4. The public repository must be named `travel-planner`. For another name, change `base` in `vite.config.ts`.

## Quality

```bash
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

SQL tests, including invite-join privileges and use counts:

```bash
supabase test db
```

Open-Meteo is used only non-commercially, with an on-screen source credit. A later commercial deployment needs a fresh license review.
