import { Check, Copy, Users } from 'lucide-react'
import { useState } from 'react'
import { Avatar, PageIntro } from '../../components/ui'
import type { Trip } from '../../types'

export interface PeoplePageProps {
  trip: Trip
  currentMemberId: string
  onCreateInvitation: () => Promise<string>
}

export function PeoplePage({
  trip,
  currentMemberId,
  onCreateInvitation,
}: PeoplePageProps) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${window.location.origin}${window.location.pathname}#/join?code=${trip.inviteCode}`

  async function copyInvite() {
    let url = inviteUrl
    if (!trip.inviteCode) {
      const code = await onCreateInvitation()
      if (!code) return
      url = `${window.location.origin}${window.location.pathname}#/join?code=${code}`
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="page-content">
      <PageIntro title="Eure Reisegruppe" text="Alle Mitreisenden und Einladungen verwalten." />
      <section className="invite-card">
        <div>
          <span className="eyebrow">Einladungscode</span>
          <strong>{trip.inviteCode || 'Neu erzeugen'}</strong>
          <p>Der Code kann jederzeit durch einen neuen ersetzt werden.</p>
        </div>
        <button className="primary-button" onClick={copyInvite}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Kopiert' : 'Link kopieren'}
        </button>
      </section>
      <section className="card members-card">
        <div className="section-heading"><h2>{trip.members.length} Reisende</h2><Users /></div>
        {trip.members.map((member) => (
          <div className="member-row" key={member.id}>
            <Avatar name={member.name} color={member.color} />
            <div>
              <strong>{member.name}{member.id === currentMemberId && ' (Du)'}</strong>
              <span>{member.role === 'owner' ? 'Owner' : 'Mitglied'}</span>
            </div>
            <span className="status">Aktiv</span>
          </div>
        ))}
      </section>
    </div>
  )
}
