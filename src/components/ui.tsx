import { Route, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

export function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Route aria-hidden="true" />
      </div>
      <span>Travel Planner</span>
    </div>
  )
}

export function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span className="avatar" style={{ backgroundColor: color }} title={name}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

export function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

export function PageIntro({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="page-intro">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </div>
  )
}

export function EditorCard({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <section className="card editor-card">
      <div className="section-heading">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>
      {children}
    </section>
  )
}

type FieldProps = { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>

export function Field({ label, ...props }: FieldProps) {
  return (
    <label>
      {label}
      <input {...props} />
    </label>
  )
}

export function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="form-actions full-field">
      <button type="button" className="secondary-button" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="primary-button">
        Save
      </button>
    </div>
  )
}

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (!dialog) return

    dialog.showModal()
    dialog.querySelector<HTMLElement>('input, select, textarea, button')?.focus()

    return () => {
      if (dialog.open) dialog.close()
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="dialog-backdrop"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="dialog">
        <div className="section-heading">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        {children}
      </section>
    </dialog>
  )
}
