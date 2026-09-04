import type { FormEvent } from 'react'
import { Dialog, Field, FormActions } from '../components/ui'
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
  onCreate: (trip: CreateTripInput, ownerName: string) => Promise<void>
  defaultOwnerName?: string
}) {
  const ownerName = isPlaceholderName(defaultOwnerName) ? '' : defaultOwnerName

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    await onCreate(
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
  }

  return (
    <Dialog title="Neue Reise planen" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Field
          label="Dein Name"
          name="ownerName"
          defaultValue={ownerName}
          autoComplete="nickname"
          required
          maxLength={60}
        />
        <Field label="Reisename" name="title" required />
        <Field label="Reiseziel" name="destination" required />
        <Field label="Start" name="startsOn" type="date" required />
        <Field label="Ende" name="endsOn" type="date" required />
        <Field label="Breitengrad (optional)" name="latitude" type="number" step="any" />
        <Field label="Längengrad (optional)" name="longitude" type="number" step="any" />
        <FormActions onCancel={onClose} />
      </form>
    </Dialog>
  )
}
