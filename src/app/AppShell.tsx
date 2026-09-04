import {
  ArrowRight,
  ChevronDown,
  Link2,
  MapPin,
  Menu,
  Plus,
  Route,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Avatar, Brand } from '../components/ui'
import { BookingsPage, type BookingsPageProps } from '../features/bookings/BookingsPage'
import { ExpensesPage, type ExpensesPageProps } from '../features/expenses/ExpensesPage'
import { ItineraryPage, type ItineraryPageProps } from '../features/itinerary/ItineraryPage'
import { OverviewPage, type OverviewPageProps } from '../features/overview/OverviewPage'
import { PackingPage, type PackingPageProps } from '../features/packing/PackingPage'
import { PeoplePage, type PeoplePageProps } from '../features/people/PeoplePage'
import { useTabRoute } from '../hooks/use-tab-route'
import { formatShortDate } from '../lib/dates'
import type { JoinTripResult } from '../lib/use-travel-store'
import type { Member, Trip } from '../types'
import { CreateTripDialog, type CreateTripInput } from './CreateTripDialog'
import { JoinTripDialog } from './JoinTripDialog'
import { tabs, type Tab } from './navigation'

export interface AppShellProps {
  trips: Trip[]
  activeTrip?: Trip
  activeTripId: string
  currentMember?: Member
  displayName: string
  invitedCode: string
  isOnline: boolean
  syncError: string
  isDemoMode: boolean
  onSelectTrip: (id: string) => void
  onCreateTrip: (trip: CreateTripInput, ownerName: string) => Promise<boolean>
  onJoinTrip: (code: string, name: string) => Promise<JoinTripResult>
  overview: Omit<OverviewPageProps, 'trip'>
  itinerary: Omit<ItineraryPageProps, 'trip'>
  bookings: Omit<BookingsPageProps, 'trip'>
  packing: Omit<PackingPageProps, 'trip'>
  expenses: Omit<ExpensesPageProps, 'trip'>
  people: Omit<PeoplePageProps, 'trip'>
}

export function AppShell(props: AppShellProps) {
  const { tab, navigate } = useTabRoute()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [dismissedInviteCode, setDismissedInviteCode] = useState('')
  const currentMember = props.currentMember ?? {
    id: 'placeholder',
    name: props.displayName || 'Gast',
    role: 'member' as const,
    color: '#70807a',
  }

  const inviteDialogOpen =
    joinOpen ||
    Boolean(
      props.invitedCode && props.invitedCode !== dismissedInviteCode,
    )

  function closeJoinDialog() {
    setJoinOpen(false)
    setDismissedInviteCode(props.invitedCode)
  }

  async function createTrip(trip: CreateTripInput, ownerName: string) {
    const created = await props.onCreateTrip(trip, ownerName)
    if (created) setCreateOpen(false)
  }

  async function joinTrip(code: string, name: string) {
    const result = await props.onJoinTrip(code, name)
    if (result.ok) closeJoinDialog()
    return result
  }

  const dialogs = (
    <>
      {createOpen && (
        <CreateTripDialog
          onClose={() => setCreateOpen(false)}
          onCreate={createTrip}
          defaultOwnerName={props.displayName}
        />
      )}
      {inviteDialogOpen && (
        <JoinTripDialog
          initialCode={props.invitedCode}
          onClose={closeJoinDialog}
          onJoin={joinTrip}
          defaultName={props.displayName}
        />
      )}
    </>
  )

  if (!props.activeTrip) {
    return (
      <>
        <EmptyWelcome onCreate={() => setCreateOpen(true)} onJoin={() => setJoinOpen(true)} />
        {dialogs}
      </>
    )
  }

  const trip = props.activeTrip
  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button className="icon-button" onClick={() => setSidebarOpen(true)} aria-label="Menü öffnen">
          <Menu />
        </button>
        <Brand />
        <Avatar name={currentMember.name} color={currentMember.color} />
      </header>

      <aside className={sidebarOpen ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="sidebar-top">
          <Brand />
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Menü schließen">
            <X />
          </button>
        </div>
        <div className="trip-switcher">
          <label htmlFor="trip-select">Deine Reisen</label>
          <div className="select-wrap">
            <select id="trip-select" value={props.activeTripId} onChange={(event) => props.onSelectTrip(event.target.value)}>
              {props.trips.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
        </div>
        <Navigation
          tab={tab}
          onSelect={(nextTab) => {
            navigate(nextTab)
            setSidebarOpen(false)
          }}
        />
        <div className="sidebar-actions">
          <button className="secondary-button" onClick={() => setJoinOpen(true)}>
            <Link2 aria-hidden="true" /> Reise beitreten
          </button>
          <button className="primary-button" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" /> Neue Reise
          </button>
        </div>
        <div className="profile">
          <Avatar name={currentMember.name} color={currentMember.color} />
          <div>
            <strong>{currentMember.name}</strong>
            <span>
              {currentMember.role === 'owner' ? 'Reise-Owner' : 'Mitglied'}
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Menü schließen" />}

      <main>
        {(!props.isOnline || props.syncError || props.isDemoMode) && (
          <div className={!props.isOnline || props.syncError ? 'system-banner error' : 'system-banner'}>
            {!props.isOnline
              ? 'Offline: Bereits geladene Inhalte sind verfügbar, Änderungen sind erst mit Internet möglich.'
              : props.syncError ||
                'Demo-Modus: Verbinde Supabase über die Umgebungsvariablen für geräteübergreifende Zusammenarbeit.'}
          </div>
        )}
        <TripHeader trip={trip} tab={tab} />
        {tab === 'overview' && <OverviewPage trip={trip} {...props.overview} />}
        {tab === 'plan' && <ItineraryPage trip={trip} {...props.itinerary} />}
        {tab === 'bookings' && <BookingsPage trip={trip} {...props.bookings} />}
        {tab === 'packing' && <PackingPage trip={trip} {...props.packing} />}
        {tab === 'expenses' && <ExpensesPage trip={trip} {...props.expenses} />}
        {tab === 'people' && <PeoplePage trip={trip} {...props.people} />}
      </main>

      <MobileNavigation tab={tab} onSelect={navigate} />
      {dialogs}
    </div>
  )
}

function Navigation({ tab, onSelect }: { tab: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav aria-label="Reisebereiche">
      {tabs.map((item) => {
        const Icon = item.icon
        return (
          <button className={tab === item.id ? 'nav-item active' : 'nav-item'} key={item.id} onClick={() => onSelect(item.id)}>
            <Icon aria-hidden="true" />{item.label}
          </button>
        )
      })}
    </nav>
  )
}

function MobileNavigation({ tab, onSelect }: { tab: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation">
      {tabs.filter((item) => item.showOnMobile).map((item) => {
        const Icon = item.icon
        return <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => onSelect(item.id)}><Icon /><span>{item.label}</span></button>
      })}
    </nav>
  )
}

function TripHeader({ trip, tab }: { trip: Trip; tab: Tab }) {
  return (
    <header className="trip-header">
      <div>
        <span className="eyebrow">{tabs.find((item) => item.id === tab)?.label}</span>
        <h1>{trip.title}</h1>
        <p><MapPin size={16} aria-hidden="true" />{trip.destination}<span>·</span>{formatShortDate(trip.startsOn)} – {formatShortDate(trip.endsOn)}</p>
      </div>
    </header>
  )
}

function EmptyWelcome({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <main className="empty-welcome">
      <Brand />
      <div className="brand-mark large"><Route /></div>
      <span className="eyebrow">Gemeinsam unterwegs</span>
      <h1>Die nächste Reise beginnt hier.</h1>
      <p>Plane Tage, Packlisten und Kosten gemeinsam mit anderen.</p>
      <div>
        <button className="primary-button" onClick={onCreate}>Reise planen <ArrowRight /></button>
        <button className="secondary-button" onClick={onJoin}>Code eingeben</button>
      </div>
    </main>
  )
}
