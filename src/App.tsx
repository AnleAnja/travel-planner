import { AppShell } from './app/AppShell'
import { useInviteCode } from './hooks/use-invite-code'
import { useOnlineStatus } from './hooks/use-online-status'
import { useTravelStore } from './lib/use-travel-store'

function App() {
  const store = useTravelStore()
  const invitedCode = useInviteCode()
  const isOnline = useOnlineStatus()
  const tripMember = store.activeTrip?.members.find(
    (member) => member.id === store.currentMemberId,
  )
  const currentMember = tripMember
    ? {
        ...tripMember,
        name: store.displayName || tripMember.name,
      }
    : store.displayName
      ? {
          id: store.currentMemberId,
          name: store.displayName,
          role: 'member' as const,
          color: '#70807a',
        }
      : undefined

  return (
    <AppShell
      trips={store.trips}
      activeTrip={store.activeTrip}
      activeTripId={store.activeTripId}
      currentMember={currentMember}
      displayName={store.displayName}
      invitedCode={invitedCode ?? ''}
      isOnline={isOnline}
      syncError={store.syncError}
      isDemoMode={store.isDemoMode}
      onSelectTrip={store.setActiveTripId}
      onCreateTrip={store.createTrip}
      onJoinTrip={store.joinTrip}
      overview={{
        currentMemberId: store.currentMemberId,
        onAddNote: store.addNote,
      }}
      itinerary={{
        onAddActivity: store.addActivity,
        onDeleteActivity: store.deleteActivity,
      }}
      bookings={{
        onAddBooking: store.addBooking,
        onDeleteBooking: store.deleteBooking,
      }}
      packing={{
        currentMemberId: store.currentMemberId,
        onAddPackingItem: store.addPackingItem,
        onTogglePackingItem: store.togglePackingItem,
        onDeletePackingItem: store.deletePackingItem,
      }}
      expenses={{
        onAddExpense: store.addExpense,
        onDeleteExpense: store.deleteExpense,
      }}
      people={{
        currentMemberId: store.currentMemberId,
        onCreateInvitation: store.createInvitation,
        onUpdateDisplayName: store.updateDisplayName,
      }}
    />
  )
}

export default App
