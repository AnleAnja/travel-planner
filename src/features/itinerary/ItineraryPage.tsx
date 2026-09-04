import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { EditorCard, Field, FormActions, PageIntro } from '../../components/ui'
import { groupBy } from '../../lib/collections'
import { formatDay, formatShortDate } from '../../lib/dates'
import { getGoogleMapsEmbedUrl, isGoogleMapsLink } from '../../lib/maps'
import type { Activity, Trip } from '../../types'

export interface ItineraryPageProps {
  trip: Trip
  onAddActivity: (activity: Activity) => void
  onDeleteActivity: (id: string) => void
}

export function ItineraryPage({
  trip,
  onAddActivity,
  onDeleteActivity,
}: ItineraryPageProps) {
  const [showForm, setShowForm] = useState(false)
  const [locationError, setLocationError] = useState('')
  const grouped = groupBy(
    [...trip.activities].sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    ),
    (activity) => activity.date,
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const locationUrl = String(data.get('locationUrl'))
    if (!isGoogleMapsLink(locationUrl)) {
      setLocationError(
        'Bitte füge einen vollständigen Google-Maps-Link ein. Kurzlinks werden noch nicht unterstützt.',
      )
      return
    }
    onAddActivity({
      id: crypto.randomUUID(),
      date: String(data.get('date')),
      time: String(data.get('time')),
      title: String(data.get('title')),
      locationUrl,
      notes: String(data.get('notes')),
    })
    setLocationError('')
    setShowForm(false)
  }

  return (
    <div className="page-content">
      <PageIntro
        title="Euer Tagesplan"
        text="Alle Pläne, Uhrzeiten und Orte."
        action={
          <button className="primary-button" onClick={() => setShowForm(true)}>
            <Plus /> Aktivität
          </button>
        }
      />
      {showForm && (
        <EditorCard title="Aktivität hinzufügen" onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Titel" name="title" required />
            <Field
              label="Google-Maps-Link"
              name="locationUrl"
              type="url"
              required
            />
            <Field label="Datum" name="date" type="date" defaultValue={trip.startsOn} required />
            <Field label="Uhrzeit" name="time" type="time" required />
            {locationError && <p className="form-error full-field" role="alert">{locationError}</p>}
            <label className="full-field">
              Notiz
              <textarea name="notes" rows={3} />
            </label>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </EditorCard>
      )}
      <div className="timeline">
        {Object.entries(grouped).map(([date, activities]) => (
          <section className="day" key={date}>
            <div className="day-label">
              <strong>{formatDay(date)}</strong>
              <span>{formatShortDate(date)}</span>
            </div>
            <div className="activity-list">
              {activities.map((activity) => (
                <article className="activity-card" key={activity.id}>
                  <time>{activity.time}</time>
                  <div>
                    <h3>{activity.title}</h3>
                    <a href={activity.locationUrl} target="_blank" rel="noreferrer">
                      <MapPin size={15} />
                      In Google Maps öffnen
                    </a>
                    {activity.notes && <p>{activity.notes}</p>}
                  </div>
                  <button
                    className="icon-button subtle"
                    onClick={() => onDeleteActivity(activity.id)}
                    aria-label={`${activity.title} löschen`}
                  >
                    <Trash2 />
                  </button>
                  <iframe
                    className="activity-map"
                    src={getGoogleMapsEmbedUrl(activity.locationUrl)}
                    title={`Karte für ${activity.title}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
