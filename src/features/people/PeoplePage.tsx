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

  async function copyInviteLink(code: string) {
    const url = `${window.location.origin}${window.location.pathname}#/join?code=${code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setInviteError(
        'Could not copy the link. Your new code is still shown above.',
      )
    }
  }

  async function copyInvite() {
    setInviteError('')
    let code = trip.inviteCode
    try {
      if (!code) {
        setCreatingCode(true)
        code = await onCreateInvitation()
        if (!code) {
          setInviteError('The invite code could not be created.')
          return
        }
      }
      await copyInviteLink(code)
    } catch {
      setInviteError('The invite code could not be created.')
    } finally {
      setCreatingCode(false)
    }
  }

  async function regenerateInvite() {
    setInviteError('')
    setCreatingCode(true)
    try {
      const code = await onCreateInvitation()
      if (!code) {
        setInviteError('The invite code could not be created.')
        return
      }
      await copyInviteLink(code)
    } catch {
      setInviteError('The invite code could not be created.')
    } finally {
      setCreatingCode(false)
    }
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('displayName')).trim()
    if (!name) {
      setNameError('Please enter a name.')
      return
    }
    const saved = await onUpdateDisplayName(name)
    if (!saved) {
      setNameError('The name could not be saved.')
      return
    }
    setNameError('')
    setEditingName(false)
  }

  return (
    <div className="page-content">
      <PageIntro title="Your travel group" text="Everyone traveling with you, plus invites." />
      <section className="invite-card">
        <div>
          <span className="eyebrow">Invite code</span>
          <strong>{trip.inviteCode || 'No code yet'}</strong>
          <p>
            Share the link or code with fellow travelers. A new code replaces
            the previous one; old links then stop working.
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
              ? 'Copied'
              : trip.inviteCode
                ? 'Copy link'
                : 'Create code'}
          </button>
          {trip.inviteCode && (
            <button
              className="secondary-button"
              onClick={regenerateInvite}
              disabled={creatingCode}
            >
              <RefreshCw />
              Create new
            </button>
          )}
        </div>
      </section>
      <section className="card members-card">
        <div className="section-heading"><h2>{trip.members.length} travelers</h2><Users /></div>
        {trip.members.map((member) => {
          const isCurrent = member.id === currentMemberId
          return (
            <div className="member-row" key={member.id}>
              <Avatar name={member.name} color={member.color} />
              <div>
                <strong>
                  {member.name}
                  {isCurrent && ' (You)'}
                </strong>
                <span>{member.role === 'owner' ? 'Owner' : 'Member'}</span>
              </div>
              {isCurrent ? (
                <button
                  className="icon-button subtle"
                  onClick={() => setEditingName((open) => !open)}
                  aria-label="Edit name"
                >
                  <Pencil />
                </button>
              ) : (
                <span className="status">Active</span>
              )}
            </div>
          )
        })}
        {editingName && (
          <form className="inline-form name-edit-form" onSubmit={saveName}>
            <Field
              label="Your name"
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
              Save
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setEditingName(false)
                setNameError('')
              }}
            >
              Cancel
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
