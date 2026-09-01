export type MemberRole = 'owner' | 'member'
export type PackingVisibility = 'shared' | 'private'

export interface Member {
  id: string
  name: string
  role: MemberRole
  color: string
}

export interface Activity {
  id: string
  date: string
  time: string
  title: string
  locationUrl: string
  notes: string
}

export type BookingType =
  | 'accommodation'
  | 'flight'
  | 'train'
  | 'rental'
  | 'activity'
  | 'other'

export interface Booking {
  id: string
  type: BookingType
  title: string
  provider: string
  confirmationNumber: string
  startsAt: string
  endsAt?: string
  location: string
  bookingUrl: string
  notes: string
}

export interface PackingItem {
  id: string
  label: string
  category: string
  visibility: PackingVisibility
  ownerId: string
  assignedTo?: string
  packed: boolean
}

export interface ExpenseShare {
  memberId: string
  amountCents: number
}

export interface Expense {
  id: string
  description: string
  amountCents: number
  paidBy: string
  date: string
  shares: ExpenseShare[]
}

export interface TripNote {
  id: string
  text: string
  createdBy: string
}

export interface Trip {
  id: string
  title: string
  destination: string
  latitude: number
  longitude: number
  startsOn: string
  endsOn: string
  timezone: string
  currency: string
  inviteCode: string
  members: Member[]
  activities: Activity[]
  bookings: Booking[]
  packingItems: PackingItem[]
  expenses: Expense[]
  notes: TripNote[]
  archived?: boolean
}

export interface Settlement {
  from: Member
  to: Member
  amountCents: number
}
