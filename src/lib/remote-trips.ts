import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Activity,
  Booking,
  Expense,
  Member,
  PackingItem,
  Trip,
  TripNote,
} from '../types'

interface Row {
  [key: string]: unknown
}

export async function loadRemoteTrips(client: SupabaseClient): Promise<Trip[]> {
  const { data: tripRows, error } = await client
    .from('trips')
    .select('*')
    .order('starts_on')
  if (error) throw error
  if (!tripRows.length) return []

  const tripIds = tripRows.map((trip) => trip.id)
  const [
    memberships,
    activities,
    bookings,
    packingItems,
    expenses,
    notes,
  ] = await Promise.all([
    client.from('trip_members').select('*').in('trip_id', tripIds),
    client.from('activities').select('*').in('trip_id', tripIds),
    client.from('bookings').select('*').in('trip_id', tripIds),
    client.from('packing_items').select('*').in('trip_id', tripIds),
    client.from('expenses').select('*, expense_shares(*)').in('trip_id', tripIds),
    client.from('trip_notes').select('*').in('trip_id', tripIds),
  ])

  const memberRows = memberships.data ?? []
  const userIds = [...new Set(memberRows.map((member) => member.user_id))]
  const profiles = userIds.length
    ? await client.from('profiles').select('*').in('user_id', userIds)
    : { data: [] }
  const profileNames = new Map(
    (profiles.data ?? []).map((profile) => [
      profile.user_id,
      profile.display_name,
    ]),
  )

  return tripRows.map((trip) => ({
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    latitude: trip.latitude ?? 0,
    longitude: trip.longitude ?? 0,
    startsOn: trip.starts_on,
    endsOn: trip.ends_on,
    timezone: trip.timezone,
    currency: trip.currency,
    inviteCode: '',
    archived: Boolean(trip.archived_at),
    members: memberRows
      .filter((member) => member.trip_id === trip.id)
      .map(
        (member, index): Member => ({
          id: member.user_id,
          name:
            profileNames.get(member.user_id) ?? `[Gast ${index + 1}]`,
          role: member.role,
          color: memberColor(member.user_id),
        }),
      ),
    activities: ((activities.data ?? []) as Row[])
      .filter((activity) => activity.trip_id === trip.id)
      .map(
        (activity): Activity => ({
          id: String(activity.id),
          date: String(activity.day),
          time: String(activity.starts_at ?? '').slice(0, 5),
          title: String(activity.title),
          locationUrl: String(activity.location_url ?? ''),
          notes: String(activity.notes ?? ''),
        }),
      ),
    bookings: ((bookings.data ?? []) as Row[])
      .filter((booking) => booking.trip_id === trip.id)
      .map(
        (booking): Booking => ({
          id: String(booking.id),
          type: booking.booking_type as Booking['type'],
          title: String(booking.title),
          provider: String(booking.provider ?? ''),
          confirmationNumber: String(booking.confirmation_number ?? ''),
          startsAt: String(booking.starts_at).slice(0, 16),
          endsAt: booking.ends_at
            ? String(booking.ends_at).slice(0, 16)
            : undefined,
          location: String(booking.location ?? ''),
          bookingUrl: String(booking.booking_url ?? ''),
          notes: String(booking.notes ?? ''),
        }),
      ),
    packingItems: ((packingItems.data ?? []) as Row[])
      .filter((item) => item.trip_id === trip.id)
      .map(
        (item): PackingItem => ({
          id: String(item.id),
          label: String(item.label),
          category: String(item.category),
          visibility: item.visibility as PackingItem['visibility'],
          ownerId: String(item.owner_user_id),
          assignedTo: item.assigned_to ? String(item.assigned_to) : undefined,
          packed: Boolean(item.packed),
        }),
      ),
    expenses: ((expenses.data ?? []) as Row[])
      .filter((expense) => expense.trip_id === trip.id)
      .map(
        (expense): Expense => ({
          id: String(expense.id),
          description: String(expense.description),
          amountCents: Number(expense.amount_cents),
          paidBy: String(expense.paid_by),
          date: String(expense.expense_date),
          shares: ((expense.expense_shares ?? []) as Row[]).map((share) => ({
            memberId: String(share.user_id),
            amountCents: Number(share.amount_cents),
          })),
        }),
      ),
    notes: ((notes.data ?? []) as Row[])
      .filter((note) => note.trip_id === trip.id)
      .map(
        (note): TripNote => ({
          id: String(note.id),
          text: String(note.body),
          createdBy: String(note.created_by),
        }),
      ),
  }))
}

function memberColor(userId: string) {
  const colors = ['#e86f51', '#397f73', '#8167a9', '#b4833f', '#426a91']
  const value = [...userId].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return colors[value % colors.length]
}
