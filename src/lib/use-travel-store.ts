import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Activity,
  Booking,
  Expense,
  PackingItem,
  Trip,
  TripNote,
} from '../types'
import { loadRemoteTrips } from './remote-trips'
import { currentMemberId as demoMemberId, demoTrips } from './seed'
import {
  ensureAnonymousSession,
  isSupabaseConfigured,
  supabase,
} from './supabase'

const storageKey = 'reiseplaner.trips.v2'
const invitationStorageKey = 'reiseplaner.invitation-codes.v1'
const channelName = 'reiseplaner-updates-v2'
const displayName = '[Dein Name]'

function loadLocalTrips() {
  try {
    const stored = localStorage.getItem(storageKey)
    const trips = stored ? (JSON.parse(stored) as Trip[]) : demoTrips
    return normalizeTrips(trips)
  } catch {
    return normalizeTrips(demoTrips)
  }
}

export function useTravelStore() {
  const [trips, setTrips] = useState<Trip[]>(loadLocalTrips)
  const [activeTripId, setActiveTripId] = useState(() => trips[0]?.id ?? '')
  const [currentMemberId, setCurrentMemberId] = useState(demoMemberId)
  const [syncError, setSyncError] = useState('')

  const reloadRemote = useCallback(async () => {
    if (!supabase) return
    try {
      const invitationCodes = loadInvitationCodes()
      const remoteTrips = (await loadRemoteTrips(supabase)).map((trip) => ({
        ...trip,
        inviteCode: invitationCodes[trip.id] ?? '',
      }))
      setTrips(remoteTrips)
      setActiveTripId((current) =>
        remoteTrips.some((trip) => trip.id === current)
          ? current
          : (remoteTrips[0]?.id ?? ''),
      )
      setSyncError('')
    } catch (error) {
      console.error(error)
      setSyncError('Die Synchronisierung ist gerade nicht verfügbar.')
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    void ensureAnonymousSession()
      .then(async (session) => {
        if (!session || !active) return
        setCurrentMemberId(session.user.id)
        await client.from('profiles').upsert({
          user_id: session.user.id,
          display_name: displayName,
        })
        await reloadRemote()
      })
      .catch((error) => {
        console.error(error)
        setSyncError('Anonyme Anmeldung fehlgeschlagen.')
      })

    const channel = client
      .channel('trip-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => void reloadRemote(),
      )
      .subscribe()

    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [reloadRemote])

  useEffect(() => {
    if (isSupabaseConfigured) return
    localStorage.setItem(storageKey, JSON.stringify(trips))
    const channel = new BroadcastChannel(channelName)
    channel.postMessage(trips)
    channel.close()
  }, [trips])

  useEffect(() => {
    if (isSupabaseConfigured) return
    const channel = new BroadcastChannel(channelName)
    channel.onmessage = (event) => setTrips(event.data as Trip[])
    return () => channel.close()
  }, [])

  const activeTrip = useMemo(
    () => trips.find((trip) => trip.id === activeTripId) ?? trips[0],
    [activeTripId, trips],
  )

  const updateActiveTrip = useCallback(
    (updater: (trip: Trip) => Trip) => {
      if (!activeTrip) return
      setTrips((current) =>
        current.map((trip) => (trip.id === activeTrip.id ? updater(trip) : trip)),
      )
    },
    [activeTrip],
  )

  const persist = useCallback(
    async (operation: () => PromiseLike<{ error: unknown }>) => {
      if (!supabase) return
      const { error } = await operation()
      if (error) {
        console.error(error)
        setSyncError('Eine Änderung konnte nicht gespeichert werden.')
        await reloadRemote()
      }
    },
    [reloadRemote],
  )

  const createTrip = useCallback(
    async (
      trip: Omit<
        Trip,
        | 'id'
        | 'inviteCode'
        | 'members'
        | 'activities'
        | 'bookings'
        | 'packingItems'
        | 'expenses'
        | 'notes'
      >,
    ) => {
      if (supabase) {
        const { data, error } = await supabase.rpc('create_trip', {
          trip_title: trip.title,
          trip_destination: trip.destination,
          trip_starts_on: trip.startsOn,
          trip_ends_on: trip.endsOn,
          trip_timezone: trip.timezone,
          trip_currency: trip.currency,
          trip_latitude: trip.latitude,
          trip_longitude: trip.longitude,
        })
        if (error) {
          setSyncError('Die Reise konnte nicht erstellt werden.')
          return
        }
        const { data: invitation } = await supabase.rpc(
          'create_trip_invitation',
          { requested_trip_id: data.id },
        )
        const inviteCode = invitation?.[0]?.code ?? ''
        if (inviteCode) saveInvitationCode(data.id, inviteCode)
        await reloadRemote()
        setActiveTripId(data.id)
        return
      }

      const id = crypto.randomUUID()
      const created: Trip = {
        ...trip,
        id,
        inviteCode: generateInviteCode(),
        members: [
          {
            id: currentMemberId,
            name: displayName,
            role: 'owner',
            color: '#e86f51',
          },
        ],
        activities: [],
        bookings: [],
        packingItems: [],
        expenses: [],
        notes: [],
      }
      setTrips((current) => [...current, created])
      setActiveTripId(id)
    },
    [currentMemberId, reloadRemote],
  )

  const joinTrip = useCallback(
    async (code: string, name: string) => {
      if (supabase) {
        const { data, error } = await supabase.functions.invoke('join-trip', {
          body: { code, displayName: name },
        })
        if (error || !data?.tripId) return false
        await reloadRemote()
        setActiveTripId(data.tripId)
        return true
      }

      const match = trips.find(
        (trip) => trip.inviteCode.toLowerCase() === code.trim().toLowerCase(),
      )
      if (!match) return false
      updateTrip(setTrips, match.id, (trip) => ({
        ...trip,
        members: trip.members.some((member) => member.id === currentMemberId)
          ? trip.members
          : [
              ...trip.members,
              {
                id: currentMemberId,
                name,
                role: 'member',
                color: '#e86f51',
              },
            ],
      }))
      setActiveTripId(match.id)
      return true
    },
    [currentMemberId, reloadRemote, trips],
  )

  const createInvitation = useCallback(async () => {
    if (!activeTrip) return ''
    if (!supabase) return activeTrip.inviteCode

    const { data, error } = await supabase.rpc('create_trip_invitation', {
      requested_trip_id: activeTrip.id,
    })
    if (error || !data?.[0]?.code) {
      setSyncError('Die Einladung konnte nicht erstellt werden.')
      return ''
    }
    const code = data[0].code as string
    saveInvitationCode(activeTrip.id, code)
    updateActiveTrip((trip) => ({ ...trip, inviteCode: code }))
    return code
  }, [activeTrip, updateActiveTrip])

  const addActivity = (activity: Activity) => {
    updateActiveTrip((trip) => ({
      ...trip,
      activities: [...trip.activities, activity],
    }))
    if (!activeTrip) return
    void persist(() =>
      supabase!.from('activities').insert({
        id: activity.id,
        trip_id: activeTrip.id,
        day: activity.date,
        starts_at: activity.time,
        title: activity.title,
        location_url: activity.locationUrl,
        notes: activity.notes,
        created_by: currentMemberId,
      }),
    )
  }

  const addBooking = (booking: Booking) => {
    updateActiveTrip((trip) => ({
      ...trip,
      bookings: [...trip.bookings, booking],
    }))
    if (!activeTrip) return
    void persist(() =>
      supabase!.from('bookings').insert({
        id: booking.id,
        trip_id: activeTrip.id,
        booking_type: booking.type,
        title: booking.title,
        provider: booking.provider,
        confirmation_number: booking.confirmationNumber,
        starts_at: booking.startsAt,
        ends_at: booking.endsAt || null,
        location: booking.location,
        booking_url: booking.bookingUrl,
        notes: booking.notes,
        created_by: currentMemberId,
      }),
    )
  }

  const addPackingItem = (item: PackingItem) => {
    updateActiveTrip((trip) => ({
      ...trip,
      packingItems: [...trip.packingItems, item],
    }))
    if (!activeTrip) return
    void persist(() =>
      supabase!.from('packing_items').insert({
        id: item.id,
        trip_id: activeTrip.id,
        label: item.label,
        category: item.category,
        visibility: item.visibility,
        owner_user_id: currentMemberId,
        assigned_to: item.assignedTo,
        packed: item.packed,
      }),
    )
  }

  const addExpense = (expense: Expense) => {
    updateActiveTrip((trip) => ({
      ...trip,
      expenses: [...trip.expenses, expense],
    }))
    if (!activeTrip || !supabase) return
    void (async () => {
      const { error } = await supabase.from('expenses').insert({
        id: expense.id,
        trip_id: activeTrip.id,
        description: expense.description,
        amount_cents: expense.amountCents,
        paid_by: expense.paidBy,
        expense_date: expense.date,
        created_by: currentMemberId,
      })
      if (!error) {
        await supabase.from('expense_shares').insert(
          expense.shares.map((share) => ({
            expense_id: expense.id,
            user_id: share.memberId,
            amount_cents: share.amountCents,
          })),
        )
      } else {
        setSyncError('Die Ausgabe konnte nicht gespeichert werden.')
        await reloadRemote()
      }
    })()
  }

  return {
    trips,
    activeTrip,
    activeTripId,
    currentMemberId,
    syncError,
    isDemoMode: !isSupabaseConfigured,
    setActiveTripId,
    createTrip,
    joinTrip,
    createInvitation,
    addActivity,
    deleteActivity: (id: string) => {
      updateActiveTrip((trip) => ({
        ...trip,
        activities: trip.activities.filter((activity) => activity.id !== id),
      }))
      void persist(() => supabase!.from('activities').delete().eq('id', id))
    },
    addBooking,
    deleteBooking: (id: string) => {
      updateActiveTrip((trip) => ({
        ...trip,
        bookings: trip.bookings.filter((booking) => booking.id !== id),
      }))
      void persist(() => supabase!.from('bookings').delete().eq('id', id))
    },
    addPackingItem,
    togglePackingItem: (id: string) => {
      const item = activeTrip?.packingItems.find((entry) => entry.id === id)
      updateActiveTrip((trip) => ({
        ...trip,
        packingItems: trip.packingItems.map((entry) =>
          entry.id === id ? { ...entry, packed: !entry.packed } : entry,
        ),
      }))
      if (item) {
        void persist(() =>
          supabase!
            .from('packing_items')
            .update({ packed: !item.packed })
            .eq('id', id),
        )
      }
    },
    deletePackingItem: (id: string) => {
      updateActiveTrip((trip) => ({
        ...trip,
        packingItems: trip.packingItems.filter((item) => item.id !== id),
      }))
      void persist(() => supabase!.from('packing_items').delete().eq('id', id))
    },
    addExpense,
    deleteExpense: (id: string) => {
      updateActiveTrip((trip) => ({
        ...trip,
        expenses: trip.expenses.filter((expense) => expense.id !== id),
      }))
      void persist(() => supabase!.from('expenses').delete().eq('id', id))
    },
    addNote: (note: TripNote) => {
      updateActiveTrip((trip) => ({ ...trip, notes: [...trip.notes, note] }))
      if (!activeTrip) return
      void persist(() =>
        supabase!.from('trip_notes').insert({
          id: note.id,
          trip_id: activeTrip.id,
          body: note.text,
          created_by: currentMemberId,
        }),
      )
    },
  }
}

function loadInvitationCodes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(invitationStorageKey) ?? '{}')
  } catch {
    return {}
  }
}

function saveInvitationCode(tripId: string, code: string) {
  localStorage.setItem(
    invitationStorageKey,
    JSON.stringify({ ...loadInvitationCodes(), [tripId]: code }),
  )
}

function generateInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const random = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(random, (value) => alphabet[value % alphabet.length]).join('')
}

function normalizeTrips(trips: Trip[]) {
  return trips.map((trip) => ({
    ...trip,
    bookings: trip.bookings ?? [],
    inviteCode: trip.inviteCode || generateInviteCode(),
  }))
}

function updateTrip(
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>,
  tripId: string,
  updater: (trip: Trip) => Trip,
) {
  setTrips((current) =>
    current.map((trip) => (trip.id === tripId ? updater(trip) : trip)),
  )
}
