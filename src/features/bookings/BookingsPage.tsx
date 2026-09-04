import {
  BedDouble,
  CalendarDays,
  CarFront,
  ExternalLink,
  MapPin,
  Plane,
  Plus,
  Ticket,
  TrainFront,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { EditorCard, Field, FormActions, PageIntro, Stat } from '../../components/ui'
import type { Booking, BookingType, Trip } from '../../types'

const bookingTypeLabels: Record<BookingType, string> = {
  accommodation: 'Stay',
  flight: 'Flight',
  train: 'Train',
  rental: 'Rental car',
  activity: 'Activity',
  other: 'Other',
}

const bookingTypeIcons: Record<BookingType, typeof Ticket> = {
  accommodation: BedDouble,
  flight: Plane,
  train: TrainFront,
  rental: CarFront,
  activity: Ticket,
  other: Ticket,
}

export interface BookingsPageProps {
  trip: Trip
  onAddBooking: (booking: Booking) => void
  onDeleteBooking: (id: string) => void
}

export function BookingsPage({ trip, onAddBooking, onDeleteBooking }: BookingsPageProps) {
  const [showForm, setShowForm] = useState(false)
  const sortedBookings = [...trip.bookings].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onAddBooking({
      id: crypto.randomUUID(),
      type: String(data.get('type')) as BookingType,
      title: String(data.get('title')),
      provider: String(data.get('provider')),
      confirmationNumber: String(data.get('confirmationNumber')),
      startsAt: String(data.get('startsAt')),
      endsAt: String(data.get('endsAt')) || undefined,
      location: String(data.get('location')),
      bookingUrl: String(data.get('bookingUrl')),
      notes: String(data.get('notes')),
    })
    setShowForm(false)
  }

  return (
    <div className="page-content">
      <PageIntro
        title="Bookings"
        text="Flights, stays, tickets, and confirmations."
        action={<button className="primary-button" onClick={() => setShowForm(true)}><Plus /> Booking</button>}
      />
      <div className="booking-summary">
        <Stat
          icon={<Plane />}
          label="Travel"
          value={`${trip.bookings.filter((booking) => booking.type === 'flight' || booking.type === 'train').length} bookings`}
        />
        <Stat
          icon={<BedDouble />}
          label="Stays"
          value={`${trip.bookings.filter((booking) => booking.type === 'accommodation').length} bookings`}
        />
        <Stat icon={<Ticket />} label="Total" value={`${trip.bookings.length} bookings`} />
      </div>
      {showForm && (
        <EditorCard title="Add booking" onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              Type
              <select name="type" defaultValue="accommodation">
                {Object.entries(bookingTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <Field label="Title" name="title" required />
            <Field label="Provider" name="provider" />
            <Field
              label="Confirmation number"
              name="confirmationNumber"
            />
            <Field label="Start / check-in" name="startsAt" type="datetime-local" required />
            <Field label="End / check-out" name="endsAt" type="datetime-local" />
            <Field label="Place" name="location" />
            <Field
              label="Booking link"
              name="bookingUrl"
              type="url"
            />
            <label className="full-field">
              Notes
              <textarea name="notes" rows={3} />
            </label>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </EditorCard>
      )}
      {sortedBookings.length === 0 ? (
        <section className="card booking-empty">
          <Ticket aria-hidden="true" />
          <h2>No bookings yet</h2>
          <p>Save the first confirmation so it is ready when you need it.</p>
        </section>
      ) : (
        <div className="booking-list">
          {sortedBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onDelete={() => onDeleteBooking(booking.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, onDelete }: { booking: Booking; onDelete: () => void }) {
  const Icon = bookingTypeIcons[booking.type]
  const startsAt = new Date(booking.startsAt)
  const endsAt = booking.endsAt ? new Date(booking.endsAt) : null
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article className="booking-card">
      <div className="booking-icon"><Icon aria-hidden="true" /></div>
      <div className="booking-main">
        <span className="eyebrow">{bookingTypeLabels[booking.type]}</span>
        <h2>{booking.title}</h2>
        <p className="booking-provider">{booking.provider || 'No provider given'}</p>
        <div className="booking-time">
          <CalendarDays aria-hidden="true" />
          <span>{dateFormatter.format(startsAt)}{endsAt && ` – ${dateFormatter.format(endsAt)}`}</span>
        </div>
        {booking.location && <div className="booking-time"><MapPin aria-hidden="true" /><span>{booking.location}</span></div>}
        {booking.notes && <p className="booking-notes">{booking.notes}</p>}
      </div>
      <div className="booking-meta">
        {booking.confirmationNumber && <div><span>Confirmation</span><strong>{booking.confirmationNumber}</strong></div>}
        {booking.bookingUrl && (
          <a className="secondary-button" href={booking.bookingUrl} target="_blank" rel="noreferrer">
            Open <ExternalLink aria-hidden="true" />
          </a>
        )}
        <button className="icon-button subtle" onClick={onDelete} aria-label={`Delete ${booking.title}`}>
          <Trash2 />
        </button>
      </div>
    </article>
  )
}
