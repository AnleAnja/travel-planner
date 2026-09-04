import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Activity,
  Booking,
  Expense,
  PackingItem,
  Trip,
  TripNote,
} from '../types'
import {
  mapJoinFailure,
  parseJoinFunctionError,
  readInvitationCode,
  type ActionResult,
} from './invitations'
import { isPlaceholderName, visibleMemberName } from './names'
import { loadRemoteTrips } from './remote-trips'
import { currentMemberId as demoMemberId, demoTrips } from './seed'
import {
  ensureAnonymousSession,
  isSupabaseConfigured,
  supabase,
} from './supabase'

export type { ActionResult as JoinTripResult } from './invitations'

const storageKey = 'reiseplaner.trips.v2'
const invitationStorageKey = 'reiseplaner.invitation-codes.v1'
const displayNameStorageKey = 'reiseplaner.display-name.v1'
const channelName = 'reiseplaner-updates-v2'

function loadLocalTrips() {
  if (isSupabaseConfigured) return []
  try {
    const stored = localStorage.getItem(storageKey)
    const trips = stored ? (JSON.parse(stored) as Trip[]) : demoTrips
    return normalizeTrips(trips)
  } catch {
    return normalizeTrips(demoTrips)
  }
}

function loadStoredDisplayName() {
  try {
    const stored = localStorage.getItem(displayNameStorageKey)?.trim() ?? ''
    if (!stored || isPlaceholderName(stored)) {
      if (stored) localStorage.removeItem(displayNameStorageKey)
      return ''
    }
    return stored
  } catch {
    return ''
  }
}

function saveStoredDisplayName(name: string) {
  if (isPlaceholderName(name)) {
    localStorage.removeItem(displayNameStorageKey)
    return
  }
  localStorage.setItem(displayNameStorageKey, name)
}

export function useTravelStore() {
  const [trips, setTrips] = useState<Trip[]>(loadLocalTrips)
  const [activeTripId, setActiveTripId] = useState(() => trips[0]?.id ?? '')
  const [currentMemberId, setCurrentMemberId] = useState(demoMemberId)
  const [displayName, setDisplayName] = useState(loadStoredDisplayName)
  const [syncError, setSyncError] = useState('')

  const applyDisplayName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 60)
    if (!trimmed || isPlaceholderName(trimmed)) return
    setDisplayName(trimmed)
    saveStoredDisplayName(trimmed)
  }, [])

  const renameMemberLocally = useCallback(
    (memberId: string, name: string) => {
      setTrips((current) =>
        current.map((trip) => ({
          ...trip,
          members: trip.members.map((member) =>
            member.id === memberId ? { ...member, name } : member,
          ),
        })),
      )
    },
    [],
  )

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
      setSyncError('Sync is unavailable right now.')
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
        const { data: profile } = await client
          .from('profiles')
          .select('display_name')
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (!active) return
        if (profile?.display_name) {
          applyDisplayName(String(profile.display_name))
        }
        await reloadRemote()
      })
      .catch((error) => {
        console.error(error)
        setSyncError('Anonymous sign-in failed.')
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
  }, [applyDisplayName, reloadRemote])

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

  const namedTrips = useMemo(
    () => withVisibleMemberNames(trips, currentMemberId, displayName),
    [currentMemberId, displayName, trips],
  )

  const activeTrip = useMemo(
    () => namedTrips.find((trip) => trip.id === activeTripId) ?? namedTrips[0],
    [activeTripId, namedTrips],
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
        setSyncError('A change could not be saved.')
        await reloadRemote()
      }
    },
    [reloadRemote],
  )

  const upsertProfileName = useCallback(
    async (name: string, userId = currentMemberId) => {
      const trimmed = name.trim().slice(0, 60)
      if (!trimmed || !supabase) return false
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        display_name: trimmed,
      })
      if (error) {
        console.error(error)
        setSyncError('Your display name could not be saved.')
        return false
      }
      applyDisplayName(trimmed)
      renameMemberLocally(userId, trimmed)
      return true
    },
    [applyDisplayName, currentMemberId, renameMemberLocally],
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
      ownerName: string,
    ): Promise<ActionResult> => {
      const name = ownerName.trim().slice(0, 60)
      if (!name || isPlaceholderName(name)) {
        return { ok: false, error: 'Please enter your name.' }
      }

      if (supabase) {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id ?? currentMemberId
        if (userId !== currentMemberId) setCurrentMemberId(userId)

        const profileSaved = await upsertProfileName(name, userId)
        if (!profileSaved) {
          return { ok: false, error: 'Your display name could not be saved.' }
        }

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
          setSyncError('The trip could not be created.')
          return { ok: false, error: 'The trip could not be created.' }
        }
        const { data: invitation, error: invitationError } = await supabase.rpc(
          'create_trip_invitation',
          { requested_trip_id: data.id },
        )
        if (invitationError) {
          console.error(invitationError)
          setSyncError('The invitation could not be created.')
        }
        const inviteCode = readInvitationCode(invitation)
        if (inviteCode) saveInvitationCode(data.id, inviteCode)
        await reloadRemote()
        setActiveTripId(data.id)
        return { ok: true }
      }

      const id = crypto.randomUUID()
      applyDisplayName(name)
      const created: Trip = {
        ...trip,
        id,
        inviteCode: generateInviteCode(),
        members: [
          {
            id: currentMemberId,
            name,
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
      return { ok: true }
    },
    [applyDisplayName, currentMemberId, reloadRemote, upsertProfileName],
  )

  const joinTrip = useCallback(
    async (code: string, name: string): Promise<ActionResult> => {
      const trimmedName = name.trim().slice(0, 60)
      if (!trimmedName || isPlaceholderName(trimmedName)) {
        return { ok: false, error: 'Please enter your name.' }
      }

      if (supabase) {
        try {
          await ensureAnonymousSession()
        } catch (error) {
          console.error(error)
          return { ok: false, error: 'Sign-in failed. Please reload the page.' }
        }

        const { data, error } = await supabase.functions.invoke('join-trip', {
          body: { code: code.trim(), displayName: trimmedName },
        })

        if (error || !data?.tripId) {
          const parsed = await parseJoinFunctionError(error)
          console.error(error)
          return mapJoinFailure(parsed.status, parsed.message)
        }

        applyDisplayName(trimmedName)
        await reloadRemote()
        setActiveTripId(String(data.tripId))
        return { ok: true }
      }

      const match = trips.find(
        (trip) => trip.inviteCode.toLowerCase() === code.trim().toLowerCase(),
      )
      if (!match) {
        return {
          ok: false,
          error: 'We could not find that invite code.',
        }
      }
      applyDisplayName(trimmedName)
      updateTrip(setTrips, match.id, (trip) => ({
        ...trip,
        members: trip.members.some((member) => member.id === currentMemberId)
          ? trip.members.map((member) =>
              member.id === currentMemberId
                ? { ...member, name: trimmedName }
                : member,
            )
          : [
              ...trip.members,
              {
                id: currentMemberId,
                name: trimmedName,
                role: 'member',
                color: '#e86f51',
              },
            ],
      }))
      setActiveTripId(match.id)
      return { ok: true }
    },
    [applyDisplayName, currentMemberId, reloadRemote, trips],
  )

  const updateDisplayName = useCallback(
    async (name: string) => {
      const trimmed = name.trim().slice(0, 60)
      if (!trimmed) return false

      if (supabase) {
        return upsertProfileName(trimmed)
      }

      applyDisplayName(trimmed)
      renameMemberLocally(currentMemberId, trimmed)
      return true
    },
    [
      applyDisplayName,
      currentMemberId,
      renameMemberLocally,
      upsertProfileName,
    ],
  )

  const createInvitation = useCallback(async () => {
    if (!activeTrip) return ''
    if (!supabase) return activeTrip.inviteCode

    const { data, error } = await supabase.rpc('create_trip_invitation', {
      requested_trip_id: activeTrip.id,
    })
    const code = readInvitationCode(data)
    if (error || !code) {
      setSyncError('The invitation could not be created.')
      return ''
    }
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
        setSyncError('The expense could not be saved.')
        await reloadRemote()
      }
    })()
  }

  return {
    trips: namedTrips,
    activeTrip,
    activeTripId,
    currentMemberId,
    displayName,
    syncError,
    isDemoMode: !isSupabaseConfigured,
    setActiveTripId,
    createTrip,
    joinTrip,
    updateDisplayName,
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

function withVisibleMemberNames(
  trips: Trip[],
  memberId: string,
  displayName: string,
) {
  return trips.map((trip) => ({
    ...trip,
    members: trip.members.map((member) => {
      const raw = member.id === memberId ? displayName || member.name : member.name
      return { ...member, name: visibleMemberName(raw) }
    }),
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
