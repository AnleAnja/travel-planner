import { useState, type FormEvent } from 'react'
import { Dialog, Field, FormActions } from '../components/ui'

export function JoinTripDialog({
  initialCode,
  onClose,
  onJoin,
}: {
  initialCode: string
  onClose: () => void
  onJoin: (code: string, name: string) => Promise<boolean>
}) {
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!(await onJoin(String(data.get('code')), String(data.get('name'))))) {
      setError('Diesen Einladungscode konnten wir nicht finden.')
    }
  }

  return (
    <Dialog title="Reise beitreten" onClose={onClose}>
      <p className="dialog-copy">
        Gib den Einladungscode und den Namen ein, den deine Reisegruppe sehen soll.
      </p>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Einladungscode" name="code" defaultValue={initialCode} required />
        <Field label="Dein Name" name="name" required />
        {error && <p className="form-error full-field" role="alert">{error}</p>}
        <FormActions onCancel={onClose} />
      </form>
    </Dialog>
  )
}
