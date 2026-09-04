import { Banknote, CalendarDays, MapPin, NotebookPen, PackageCheck, Plus, Ticket, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Stat } from '../../components/ui'
import { WeatherCard } from '../../components/WeatherCard'
import { formatTripCountdown } from '../../lib/dates'
import { formatMoney } from '../../lib/settlements'
import type { Trip, TripNote } from '../../types'

export interface OverviewPageProps {
  trip: Trip
  currentMemberId: string
  onAddNote: (note: TripNote) => void
}

export function OverviewPage({ trip, currentMemberId, onAddNote }: OverviewPageProps) {
  const nextActivity = [...trip.activities].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  )[0]
  const packed = trip.packingItems.filter((item) => item.packed).length
  const totalExpenses = trip.expenses.reduce(
    (sum, expense) => sum + expense.amountCents,
    0,
  )
  const destinationName = trip.destination.split(',')[0]
  const [note, setNote] = useState('')

  function submitNote(event: FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    onAddNote({
      id: crypto.randomUUID(),
      text: note.trim(),
      createdBy: currentMemberId,
    })
    setNote('')
  }

  return (
    <div className="page-content">
      <section className="hero-card">
        <div>
          <span className="eyebrow">{formatTripCountdown(trip.startsOn)}</span>
          <h2>Willkommen in {destinationName}!</h2>
          <p>
            Alles Wichtige für eure Reise an einem Ort. Packt gemeinsam,
            plant entspannt und behaltet die Kosten im Blick.
          </p>
        </div>
        <div className="hero-stamp">{destinationName.slice(0, 3).toUpperCase()}</div>
      </section>

      <div className="dashboard-grid">
        <WeatherCard
          latitude={trip.latitude}
          longitude={trip.longitude}
          destination={trip.destination}
        />
        <section className="card next-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Als Nächstes</span>
              <h2>{nextActivity?.title ?? 'Noch nichts geplant'}</h2>
            </div>
            <CalendarDays aria-hidden="true" />
          </div>
          {nextActivity ? (
            <>
              <strong className="big-time">{nextActivity.time}</strong>
              <p>
                <MapPin size={16} aria-hidden="true" />
                <a href={nextActivity.locationUrl} target="_blank" rel="noreferrer">
                  Standort in Google Maps
                </a>
              </p>
            </>
          ) : (
            <p className="muted">Füge im Tagesplan eure erste Aktivität hinzu.</p>
          )}
        </section>
      </div>

      <div className="stats-grid">
        <Stat icon={<Ticket />} label="Buchungen" value={`${trip.bookings.length} gespeichert`} />
        <Stat icon={<PackageCheck />} label="Gepackt" value={`${packed} / ${trip.packingItems.length}`} />
        <Stat icon={<Banknote />} label="Ausgaben" value={formatMoney(totalExpenses, trip.currency)} />
        <Stat icon={<Users />} label="Reisegruppe" value={`${trip.members.length} Personen`} />
      </div>

      <section className="card notes-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Gemeinsam sammeln</span>
            <h2>Ideen & Notizen</h2>
          </div>
          <NotebookPen aria-hidden="true" />
        </div>
        <div className="note-list">
          {trip.notes.map((item) => (
            <div className="note" key={item.id}>
              <span>“</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <form className="inline-form" onSubmit={submitNote}>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-label="Neue Notiz"
          />
          <button className="primary-button" type="submit">
            <Plus aria-hidden="true" />
            Hinzufügen
          </button>
        </form>
      </section>
    </div>
  )
}
