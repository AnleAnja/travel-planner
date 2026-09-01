import { Check, ClipboardList, Lock, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar, EditorCard, Field, FormActions, PageIntro } from '../../components/ui'
import { groupBy } from '../../lib/collections'
import type { PackingItem, PackingVisibility, Trip } from '../../types'

export interface PackingPageProps {
  trip: Trip
  currentMemberId: string
  onAddPackingItem: (item: PackingItem) => void
  onTogglePackingItem: (id: string) => void
  onDeletePackingItem: (id: string) => void
}

export function PackingPage({
  trip,
  currentMemberId,
  onAddPackingItem,
  onTogglePackingItem,
  onDeletePackingItem,
}: PackingPageProps) {
  const [showForm, setShowForm] = useState(false)
  const visibleItems = trip.packingItems.filter(
    (item) => item.visibility === 'shared' || item.ownerId === currentMemberId,
  )
  const groups = groupBy(visibleItems, (item) =>
    item.visibility === 'private' ? 'Meine private Liste' : item.category,
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const visibility = String(data.get('visibility')) as PackingVisibility
    onAddPackingItem({
      id: crypto.randomUUID(),
      label: String(data.get('label')),
      category: String(data.get('category')) || 'Sonstiges',
      visibility,
      ownerId: currentMemberId,
      assignedTo: visibility === 'shared' ? String(data.get('assignedTo')) : currentMemberId,
      packed: false,
    })
    setShowForm(false)
  }

  const progress = visibleItems.length
    ? Math.round((visibleItems.filter((item) => item.packed).length / visibleItems.length) * 100)
    : 0

  return (
    <div className="page-content">
      <PageIntro
        title="Packliste"
        text="Gemeinsam organisiert, persönlich vorbereitet."
        action={<button className="primary-button" onClick={() => setShowForm(true)}><Plus /> Eintrag</button>}
      />
      <div className="progress-card">
        <div><strong>{progress}%</strong><span>bereits gepackt</span></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      </div>
      {showForm && (
        <EditorCard title="Packeintrag hinzufügen" onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Was muss mit?" name="label" required />
            <Field label="Kategorie" name="category" defaultValue="Gemeinsam" />
            <label>
              Sichtbarkeit
              <select name="visibility">
                <option value="shared">Gemeinsam</option>
                <option value="private">Nur für mich</option>
              </select>
            </label>
            <label>
              Zuständig
              <select name="assignedTo">
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </EditorCard>
      )}
      <div className="packing-grid">
        {Object.entries(groups).map(([group, items]) => (
          <section className="card packing-group" key={group}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {group === 'Meine private Liste' ? <><Lock size={13} /> Privat</> : 'Geteilt'}
                </span>
                <h2>{group}</h2>
              </div>
              <ClipboardList aria-hidden="true" />
            </div>
            <div className="check-list">
              {items.map((item) => {
                const assignee = trip.members.find((member) => member.id === item.assignedTo)
                return (
                  <div className={item.packed ? 'check-row checked' : 'check-row'} key={item.id}>
                    <button
                      className="checkbox"
                      onClick={() => onTogglePackingItem(item.id)}
                      aria-label={`${item.label} ${item.packed ? 'auspacken' : 'einpacken'}`}
                    >
                      {item.packed && <Check />}
                    </button>
                    <span>{item.label}</span>
                    {assignee && <Avatar name={assignee.name} color={assignee.color} />}
                    <button
                      className="icon-button subtle"
                      onClick={() => onDeletePackingItem(item.id)}
                      aria-label={`${item.label} löschen`}
                    >
                      <Trash2 />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
