# Travel Planner

Plan a trip with the people you travel with. Keep the day plan, bookings, packing lists, notes, weather, and shared costs in one place.

You host the app **once**. Your group does not need GitHub, Supabase, or accounts. They open an invite link, type a name, and they are in.

## How to use it

**Start a trip.** Add your name, a trip name, destination, and dates. You become the trip owner.

**Invite people.** Open **People** and copy the invite link or code. Send that link in a chat. Anyone with a current code can join and choose the name the group will see. Creating a new code retires the old one, so previous links stop working.

**Plan the days.** Add activities with a time and a full Google Maps link so the place shows on the map.

**Keep bookings handy.** Save flights, stays, tickets, and confirmation numbers so they are ready when you need them.

**Pack together.** Shared items are visible to everyone on the trip. Private items stay visible only to you.

**Split costs.** Add who paid and who should share it. The app calculates who owes whom, down to the cent.

## Demo copy vs a live group

If you open a copy that is not connected to a shared project, you are in **demo mode**. That trip stays on this device (and in other tabs on the same browser). It is useful for trying the app. Friends on other phones will not see it.

A **live** trip is stored in your own Supabase project. Changes show up for everyone who joined, and you can pick up the same trip on another device.

## Host a live copy

One person does this. Everyone else only needs the invite link.

1. Create a free [Supabase](https://supabase.com) project (EU region) and connect it as described in [docs/setup.md](docs/setup.md): anonymous sign-in, migrations, and the `join-trip` and `weather` Edge Functions.
2. For a local live run, copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Then `npm install` and `npm run dev`. The demo banner should disappear.
3. For phones and friends, deploy with GitHub Pages: **Settings → Pages** source **GitHub Actions**, then **Settings → Secrets and variables → Actions → Variables** (not Secrets):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Re-run **Actions → Test and deploy GitHub Pages** so the values are baked into the site. Open the Pages URL and confirm it is not in demo mode.
5. Create your trip. Open **People**, copy the invite link, and send it. Friends tap the link, enter the name the group should see, and join. They can add the site to their home screen if they want.

The publishable key is meant to be in the browser. Do not put the service-role key in GitHub or `.env.local`. Full operator steps, including Edge Function rules, are in [docs/setup.md](docs/setup.md).

A public Pages URL is a live product: anyone who finds it can create their own trips in your project. Invite links still gate *your* trip. Use a project you are willing to share that way, and apply every migration in `supabase/migrations`.

## Privacy in short

Only people who created the trip or joined with a valid invite can see it. Private packing items are hidden from everyone else. Invite codes expire and can be replaced.
