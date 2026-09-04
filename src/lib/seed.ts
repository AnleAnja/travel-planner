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
    title: '[Reisename]',
    destination: '[Reiseziel]',
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
        name: '[Name einer mitreisenden Person]',
        role: 'member',
        color: '#397f73',
      },
    ],
    activities: [
      {
        id: 'activity-1',
        date: startsOn,
        time: '16:00',
        title: '[Ankunft und Check-in]',
        locationUrl:
          'https://www.google.com/maps/search/?api=1&query=%5BOrt%20der%20Aktivit%C3%A4t%5D',
        notes: '[Notiz zur Aktivität]',
      },
      {
        id: 'activity-2',
        date: secondDay,
        time: '09:30',
        title: '[Gemeinsames Frühstück]',
        locationUrl:
          'https://www.google.com/maps/search/?api=1&query=%5BRestaurant%5D',
        notes: '',
      },
      {
        id: 'activity-3',
        date: secondDay,
        time: '11:30',
        title: '[Geplanter Ausflug]',
        locationUrl:
          'https://www.google.com/maps/search/?api=1&query=%5BAusflugsziel%5D',
        notes: '[Hinweis zum Ausflug]',
      },
    ],
    bookings: [
      {
        id: 'booking-1',
        type: 'flight',
        title: '[Hinreise]',
        provider: '[Reiseanbieter]',
        confirmationNumber: '[Buchungsnummer]',
        startsAt: `${startsOn}T10:20`,
        endsAt: `${startsOn}T12:45`,
        location: '[Abfahrtsort und Terminal]',
        bookingUrl: 'https://example.com/',
        notes: '[Hinweis zur Buchung]',
      },
      {
        id: 'booking-2',
        type: 'accommodation',
        title: '[Unterkunft]',
        provider: '[Buchungsanbieter]',
        confirmationNumber: '[Bestätigungsnummer]',
        startsAt: `${startsOn}T15:00`,
        endsAt: `${endsOn}T11:00`,
        location: '[Adresse der Unterkunft]',
        bookingUrl: 'https://example.com/',
        notes: '[Check-in-Information]',
      },
    ],
    packingItems: [
      {
        id: 'pack-1',
        label: '[Gemeinsamer Packgegenstand]',
        category: 'Gemeinsam',
        visibility: 'shared',
        ownerId: currentMemberId,
        assignedTo: 'member-placeholder',
        packed: true,
      },
      {
        id: 'pack-2',
        label: '[Weiterer Packgegenstand]',
        category: 'Gemeinsam',
        visibility: 'shared',
        ownerId: currentMemberId,
        assignedTo: currentMemberId,
        packed: false,
      },
      {
        id: 'pack-3',
        label: '[Persönlicher Packgegenstand]',
        category: 'Technik',
        visibility: 'private',
        ownerId: currentMemberId,
        packed: false,
      },
    ],
    expenses: [
      {
        id: 'expense-1',
        description: '[Gemeinsame Ausgabe]',
        amountCents: 48600,
        paidBy: currentMemberId,
        date: startsOn,
        shares: splitEvenly(48600, [currentMemberId, 'member-placeholder']),
      },
      {
        id: 'expense-2',
        description: '[Weitere Ausgabe]',
        amountCents: 3600,
        paidBy: 'member-placeholder',
        date: startsOn,
        shares: splitEvenly(3600, [currentMemberId, 'member-placeholder']),
      },
    ],
    notes: [
      {
        id: 'note-1',
        text: '[Hier steht eine gemeinsame Idee oder Notiz zur Reise.]',
        createdBy: currentMemberId,
      },
    ],
  },
]
