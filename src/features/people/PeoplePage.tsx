import { Check, Copy, Pencil, RefreshCw, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar, Field, PageIntro } from '../../components/ui'
import { isPlaceholderName } from '../../lib/names'
import type { Trip } from '../../types'

export interface PeoplePageProps {
  trip: Trip
  currentMemberId: string
  onCreateInvitation: () => Promise<string>
  onUpdateDisplayName: (name: string) => Promise<boolean>
}

export function PeoplePage({
  trip,
  currentMemberId,
  onCreateInvitation,
  onUpdateDisplayName,
}: PeoplePageProps) {
  const [copied, setCopied] = useState(false)
  const [creatingCode, setCreatingCode] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const currentMember = trip.members.find(
    (member) => member.id === currentMemberId,
  )

  async function copyInvite() {
    setInviteError('')
    let code = trip.inviteCode
    if (!code) {
      setCreatingCode(true)
      code = await onCreateInvitation()
      setCreatingCode(false)
      if (!code) {
        setInviteError('Der Einladungscode konnte nicht erzeugt werden.')
        return
      }
    }
    const url = `${window.location.origin}${window.location.pathname}#/join?code=${code}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function regenerateInvite() {
    setInviteError('')
    setCreatingCode(true)
    const code = await onCreateInvitation()
    setCreatingCode(false)
    if (!code) {
      setInviteError('Der Einladungscode konnte nicht erzeugt werden.')
      return
    }
    const url = `${window.location.origin}${window.location.pathname}#/join?code=${code}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('displayName')).trim()
    if (!name) {
      setNameError('Bitte gib einen Namen ein.')
      return
    }
    const saved = await onUpdateDisplayName(name)
    if (!saved) {
      setNameError('Der Name konnte nicht gespeichert werden.')
      return
    }
    setNameError('')
    setEditingName(false)
  }

  return (
    <div className="page-content">
      <PageIntro title="Eure Reisegruppe" text="Alle Mitreisenden und Einladungen verwalten." />
      <section className="invite-card">
        <div>
          <span className="eyebrow">Einladungscode</span>
          <strong>{trip.inviteCode || 'Noch kein Code'}</strong>
          <p>
            Teile den Link oder Code mit Mitreisenden. Ein neuer Code ersetzt den
            bisherigen; alte Links funktionieren dann nicht mehr.
          </p>
          {inviteError && (
            <p className="form-error" role="alert">
              {inviteError}
            </p>
          )}
        </div>
        <div className="invite-actions">
          <button
            className="primary-button"
            onClick={copyInvite}
            disabled={creatingCode}
          >
            {copied ? <Check /> : <Copy />}
            {copied
              ? 'Kopiert'
              : trip.inviteCode
                ? 'Link kopieren'
                : 'Code erzeugen'}
          </button>
          {trip.inviteCode && (
            <button
              className="secondary-button"
              onClick={regenerateInvite}
              disabled={creatingCode}
            >
              <RefreshCw />
              Neu erzeugen
            </button>
          )}
        </div>
      </section>
      <section className="card members-card">
        <div className="section-heading"><h2>{trip.members.length} Reisende</h2><Users /></div>
        {trip.members.map((member) => {
          const isCurrent = member.id === currentMemberId
          return (
            <div className="member-row" key={member.id}>
              <Avatar name={member.name} color={member.color} />
              <div>
                <strong>
                  {member.name}
                  {isCurrent && ' (Du)'}
                </strong>
                <span>{member.role === 'owner' ? 'Owner' : 'Mitglied'}</span>
              </div>
              {isCurrent ? (
                <button
                  className="icon-button subtle"
                  onClick={() => setEditingName((open) => !open)}
                  aria-label="Namen bearbeiten"
                >
                  <Pencil />
                </button>
              ) : (
                <span className="status">Aktiv</span>
              )}
            </div>
          )
        })}
        {editingName && (
          <form className="inline-form name-edit-form" onSubmit={saveName}>
            <Field
              label="Dein Name"
              name="displayName"
              defaultValue={
                currentMember && !isPlaceholderName(currentMember.name)
                  ? currentMember.name
                  : ''
              }
              required
              maxLength={60}
            />
            <button className="primary-button" type="submit">
              Speichern
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setEditingName(false)
                setNameError('')
              }}
            >
              Abbrechen
            </button>
            {nameError && (
              <p className="form-error" role="alert">
                {nameError}
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  )
}
