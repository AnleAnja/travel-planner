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
  accommodation: 'Unterkunft',
  flight: 'Flug',
  train: 'Bahn',
  rental: 'Mietwagen',
  activity: 'Aktivität',
  other: 'Sonstiges',
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
        title="Buchungen"
        text="Flüge, Unterkünfte, Tickets und Bestätigungen."
        action={<button className="primary-button" onClick={() => setShowForm(true)}><Plus /> Buchung</button>}
      />
      <div className="booking-summary">
        <Stat
          icon={<Plane />}
          label="Anreise"
          value={`${trip.bookings.filter((booking) => booking.type === 'flight' || booking.type === 'train').length} Buchungen`}
        />
        <Stat
          icon={<BedDouble />}
          label="Unterkünfte"
          value={`${trip.bookings.filter((booking) => booking.type === 'accommodation').length} Buchungen`}
        />
        <Stat icon={<Ticket />} label="Insgesamt" value={`${trip.bookings.length} Buchungen`} />
      </div>
      {showForm && (
        <EditorCard title="Buchung hinzufügen" onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              Art
              <select name="type" defaultValue="accommodation">
                {Object.entries(bookingTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <Field label="Titel" name="title" required />
            <Field label="Anbieter" name="provider" />
            <Field
              label="Buchungsnummer"
              name="confirmationNumber"
            />
            <Field label="Beginn / Check-in" name="startsAt" type="datetime-local" required />
            <Field label="Ende / Check-out" name="endsAt" type="datetime-local" />
            <Field label="Ort" name="location" />
            <Field
              label="Link zur Buchung"
              name="bookingUrl"
              type="url"
            />
            <label className="full-field">
              Notizen
              <textarea name="notes" rows={3} />
            </label>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </EditorCard>
      )}
      {sortedBookings.length === 0 ? (
        <section className="card booking-empty">
          <Ticket aria-hidden="true" />
          <h2>Noch keine Buchungen</h2>
          <p>Speichere die erste Bestätigung, damit sie unterwegs sofort zur Hand ist.</p>
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
  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
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
        <p className="booking-provider">{booking.provider || 'Kein Anbieter angegeben'}</p>
        <div className="booking-time">
          <CalendarDays aria-hidden="true" />
          <span>{dateFormatter.format(startsAt)}{endsAt && ` – ${dateFormatter.format(endsAt)}`}</span>
        </div>
        {booking.location && <div className="booking-time"><MapPin aria-hidden="true" /><span>{booking.location}</span></div>}
        {booking.notes && <p className="booking-notes">{booking.notes}</p>}
      </div>
      <div className="booking-meta">
        {booking.confirmationNumber && <div><span>Bestätigung</span><strong>{booking.confirmationNumber}</strong></div>}
        {booking.bookingUrl && (
          <a className="secondary-button" href={booking.bookingUrl} target="_blank" rel="noreferrer">
            Öffnen <ExternalLink aria-hidden="true" />
          </a>
        )}
        <button className="icon-button subtle" onClick={onDelete} aria-label={`${booking.title} löschen`}>
          <Trash2 />
        </button>
      </div>
    </article>
  )
}
