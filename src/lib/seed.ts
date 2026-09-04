import { addDays, format } from 'date-fns'
import type { Trip } from '../types'
import { splitEvenly } from './settlements'

const today = new Date()
const startsOn = format(addDays(today, 14), 'yyyy-MM-dd')
const secondDay = format(addDays(today, 15), 'yyyy-MM-dd')
const endsOn = format(addDays(today, 18), 'yyyy-MM-dd')

export const currentMemberId = 'member-current'

export const demoTrips: Trip[] = [
  {
    id: 'trip-placeholder',
    title: '[Trip name]',
    destination: '[Destination]',
    latitude: 0,
    longitude: 0,
    startsOn,
    endsOn,
    timezone: 'UTC',
    currency: 'EUR',
    inviteCode: '',
    members: [
      {
        id: currentMemberId,
        name: '',
        role: 'owner',
        color: '#e86f51',
      },
      {
        id: 'member-placeholder',
        name: '[Travel companion]',
        role: 'member',
        color: '#397f73',
      },
    ],
    activities: [
      {
        id: 'activity-1',
        date: startsOn,
        time: '16:00',
        title: '[Arrival and check-in]',
        locationUrl:
          'https://www.google.com/maps/search/?api=1&query=%5BActivity%20place%5D',
        notes: '[Note about the activity]',
      },
      {
        id: 'activity-2',
        date: secondDay,
        time: '09:30',
        title: '[Shared breakfast]',
        locationUrl:
          'https://www.google.com/maps/search/?api=1&query=%5BRestaurant%5D',
        notes: '',
      },
      {
        id: 'activity-3',
        date: secondDay,
        time: '11:30',
        title: '[Planned outing]',
        locationUrl:
          'https://www.google.com/maps/search/?api=1&query=%5BOuting%5D',
        notes: '[Note about the outing]',
      },
    ],
    bookings: [
      {
        id: 'booking-1',
        type: 'flight',
        title: '[Outbound trip]',
        provider: '[Travel provider]',
        confirmationNumber: '[Confirmation number]',
        startsAt: `${startsOn}T10:20`,
        endsAt: `${startsOn}T12:45`,
        location: '[Departure place and terminal]',
        bookingUrl: 'https://example.com/',
        notes: '[Note about the booking]',
      },
      {
        id: 'booking-2',
        type: 'accommodation',
        title: '[Stay]',
        provider: '[Booking provider]',
        confirmationNumber: '[Confirmation number]',
        startsAt: `${startsOn}T15:00`,
        endsAt: `${endsOn}T11:00`,
        location: '[Stay address]',
        bookingUrl: 'https://example.com/',
        notes: '[Check-in information]',
      },
    ],
    packingItems: [
      {
        id: 'pack-1',
        label: '[Shared packing item]',
        category: 'Shared',
        visibility: 'shared',
        ownerId: currentMemberId,
        assignedTo: 'member-placeholder',
        packed: true,
      },
      {
        id: 'pack-2',
        label: '[Another packing item]',
        category: 'Shared',
        visibility: 'shared',
        ownerId: currentMemberId,
        assignedTo: currentMemberId,
        packed: false,
      },
      {
        id: 'pack-3',
        label: '[Personal packing item]',
        category: 'Tech',
        visibility: 'private',
        ownerId: currentMemberId,
        packed: false,
      },
    ],
    expenses: [
      {
        id: 'expense-1',
        description: '[Shared expense]',
        amountCents: 48600,
        paidBy: currentMemberId,
        date: startsOn,
        shares: splitEvenly(48600, [currentMemberId, 'member-placeholder']),
      },
      {
        id: 'expense-2',
        description: '[Another expense]',
        amountCents: 3600,
        paidBy: 'member-placeholder',
        date: startsOn,
        shares: splitEvenly(3600, [currentMemberId, 'member-placeholder']),
      },
    ],
    notes: [
      {
        id: 'note-1',
        text: '[A shared idea or note about the trip.]',
        createdBy: currentMemberId,
      },
    ],
  },
]
