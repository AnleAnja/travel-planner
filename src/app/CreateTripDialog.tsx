import { useState, type FormEvent } from 'react'
import { Dialog, Field, FormActions } from '../components/ui'
import type { ActionResult } from '../lib/invitations'
import { isPlaceholderName } from '../lib/names'
import type { Trip } from '../types'

export type CreateTripInput = Omit<
  Trip,
  | 'id'
  | 'inviteCode'
  | 'members'
  | 'activities'
  | 'bookings'
  | 'packingItems'
  | 'expenses'
  | 'notes'
>

export function CreateTripDialog({
  onClose,
  onCreate,
  defaultOwnerName = '',
}: {
  onClose: () => void
  onCreate: (trip: CreateTripInput, ownerName: string) => Promise<ActionResult>
  defaultOwnerName?: string
}) {
  const [error, setError] = useState('')
  const ownerName = isPlaceholderName(defaultOwnerName) ? '' : defaultOwnerName

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await onCreate(
      {
        title: String(data.get('title')),
        destination: String(data.get('destination')),
        latitude: Number(data.get('latitude')) || 0,
        longitude: Number(data.get('longitude')) || 0,
        startsOn: String(data.get('startsOn')),
        endsOn: String(data.get('endsOn')),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency: 'EUR',
      },
      String(data.get('ownerName')),
    )
    if (!result.ok) setError(result.error)
  }

  return (
    <Dialog title="Plan a new trip" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Field
          label="Your name"
          name="ownerName"
          defaultValue={ownerName}
          autoComplete="nickname"
          required
          maxLength={60}
        />
        <Field label="Trip name" name="title" required />
        <Field label="Destination" name="destination" required />
        <Field label="Start" name="startsOn" type="date" required />
        <Field label="End" name="endsOn" type="date" required />
        <Field label="Latitude (optional)" name="latitude" type="number" step="any" />
        <Field label="Longitude (optional)" name="longitude" type="number" step="any" />
        {error && <p className="form-error full-field" role="alert">{error}</p>}
        <FormActions onCancel={onClose} />
      </form>
    </Dialog>
  )
}
