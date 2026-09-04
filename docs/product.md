# Travel Planner – MVP

## Goal

A mobile, installable web app that lets a group organize a trip without a visible sign-up. One person creates the trip and shares a revocable invite link or code. Guests receive an anonymous session in the background.

## Roles

- **Owner:** edit or archive the trip, create and revoke invites, remove members.
- **Member:** edit trip content, bookings, the shared packing list, activities, notes, and expenses.
- Private packing items are visible only to the person who created them.

## Core flows

1. Create a trip with title, destination, dates, timezone, and currency.
2. Share a link or code; the guest enters a display name and joins.
3. Plan day activities with a time, note, and embedded Google Maps link.
4. Manage flights, stays, tickets, and other booking confirmations.
5. Add shared or private packing items and check them off.
6. Record expenses with who paid and who shares the cost.
7. View weather for the destination and a settlement balance at the end.

## Product limits

- One currency per trip.
- Online-first: already loaded content can be cached; changes need internet.
- Google Maps is embedded from links the user pastes, and also opened externally; there is no Maps API key.
- Weather data comes non-commercially from Open-Meteo and is credited on screen.
- No payments, chats, push notifications, receipt scanning, or full offline sync.

## Privacy and security

- Trip content lives in Supabase, not in the public GitHub repository.
- Row Level Security enforces membership and privacy on the server.
- Invites are stored hashed, expire, and can be revoked.
- Short codes are redeemed only through the rate-limited `join-trip` Edge Function. The browser must not call `join_trip_with_code` directly.
- Service-role keys are never stored in the browser or repository.
- Free-tier operation expects periodic manual data exports.

## Acceptance criteria

- A guest can join a shared trip without a visible registration flow.
- Other anonymous sessions cannot guess trips or read private items.
- Changes from two devices appear promptly.
- The expense balance settles every cent.
- The app is installable, responsive, keyboard-usable, and explains its offline state.
