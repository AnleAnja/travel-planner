import { useState, type FormEvent } from 'react'
import { Dialog, Field, FormActions } from '../components/ui'
import { isPlaceholderName } from '../lib/names'
import type { JoinTripResult } from '../lib/use-travel-store'

export function JoinTripDialog({
  initialCode,
  onClose,
  onJoin,
  defaultName = '',
}: {
  initialCode: string
  onClose: () => void
  onJoin: (code: string, name: string) => Promise<JoinTripResult>
  defaultName?: string
}) {
  const [error, setError] = useState('')
  const name = isPlaceholderName(defaultName) ? '' : defaultName

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await onJoin(
      String(data.get('code')),
      String(data.get('name')),
    )
    if (!result.ok) setError(result.error)
  }

  return (
    <Dialog title="Reise beitreten" onClose={onClose}>
      <p className="dialog-copy">
        Gib den Einladungscode und den Namen ein, den deine Reisegruppe sehen soll.
      </p>
      <form className="form-grid" onSubmit={submit}>
        <Field
          label="Einladungscode"
          name="code"
          defaultValue={initialCode}
          required
          autoCapitalize="characters"
        />
        <Field
          label="Dein Name"
          name="name"
          defaultValue={name}
          autoComplete="nickname"
          required
          maxLength={60}
        />
        {error && <p className="form-error full-field" role="alert">{error}</p>}
        <FormActions onCancel={onClose} />
      </form>
    </Dialog>
  )
}
