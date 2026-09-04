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
          <h2>Welcome to {destinationName}!</h2>
          <p>
            Everything for this trip in one place. Pack together, plan at your
            pace, and keep an eye on the costs.
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
              <span className="eyebrow">Up next</span>
              <h2>{nextActivity?.title ?? 'Nothing planned yet'}</h2>
            </div>
            <CalendarDays aria-hidden="true" />
          </div>
          {nextActivity ? (
            <>
              <strong className="big-time">{nextActivity.time}</strong>
              <p>
                <MapPin size={16} aria-hidden="true" />
                <a href={nextActivity.locationUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </p>
            </>
          ) : (
            <p className="muted">Add your first activity in the day plan.</p>
          )}
        </section>
      </div>

      <div className="stats-grid">
        <Stat icon={<Ticket />} label="Bookings" value={`${trip.bookings.length} saved`} />
        <Stat icon={<PackageCheck />} label="Packed" value={`${packed} / ${trip.packingItems.length}`} />
        <Stat icon={<Banknote />} label="Expenses" value={formatMoney(totalExpenses, trip.currency)} />
        <Stat icon={<Users />} label="Travel group" value={`${trip.members.length} people`} />
      </div>

      <section className="card notes-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Collect together</span>
            <h2>Ideas & notes</h2>
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
            aria-label="New note"
          />
          <button className="primary-button" type="submit">
            <Plus aria-hidden="true" />
            Add
          </button>
        </form>
      </section>
    </div>
  )
}
