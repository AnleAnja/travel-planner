import { useState, type FormEvent } from 'react'
import { Dialog, Field, FormActions } from '../components/ui'
import type { ActionResult } from '../lib/invitations'
import { isPlaceholderName } from '../lib/names'

export function JoinTripDialog({
  initialCode,
  onClose,
  onJoin,
  defaultName = '',
}: {
  initialCode: string
  onClose: () => void
  onJoin: (code: string, name: string) => Promise<ActionResult>
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
    <Dialog title="Join a trip" onClose={onClose}>
      <p className="dialog-copy">
        Enter the invite code and the name your travel group should see.
      </p>
      <form className="form-grid" onSubmit={submit}>
        <Field
          label="Invite code"
          name="code"
          defaultValue={initialCode}
          required
          autoCapitalize="characters"
        />
        <Field
          label="Your name"
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
