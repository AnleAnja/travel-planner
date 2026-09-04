import {
  CalendarDays,
  Home,
  PackageCheck,
  ReceiptText,
  Ticket,
  Users,
} from 'lucide-react'

export type Tab = 'overview' | 'plan' | 'bookings' | 'packing' | 'expenses' | 'people'

export const tabs: {
  id: Tab
  label: string
  icon: typeof Home
  showOnMobile: boolean
}[] = [
  { id: 'overview', label: 'Overview', icon: Home, showOnMobile: true },
  { id: 'plan', label: 'Plan', icon: CalendarDays, showOnMobile: true },
  { id: 'bookings', label: 'Bookings', icon: Ticket, showOnMobile: true },
  { id: 'packing', label: 'Packing', icon: PackageCheck, showOnMobile: true },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText, showOnMobile: true },
  { id: 'people', label: 'People', icon: Users, showOnMobile: false },
]

export function isTab(value: string): value is Tab {
  return tabs.some((tab) => tab.id === value)
}
