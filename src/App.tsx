import { AppShell } from './app/AppShell'
import { useInviteCode } from './hooks/use-invite-code'
import { useOnlineStatus } from './hooks/use-online-status'
import { useTravelStore } from './lib/use-travel-store'

function App() {
  const store = useTravelStore()
  const invitedCode = useInviteCode()
  const isOnline = useOnlineStatus()

  return (
    <AppShell
      trips={store.trips}
      activeTrip={store.activeTrip}
      activeTripId={store.activeTripId}
      currentMember={store.activeTrip?.members.find(
        (member) => member.id === store.currentMemberId,
      )}
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
      }}
    />
  )
}

export default App
