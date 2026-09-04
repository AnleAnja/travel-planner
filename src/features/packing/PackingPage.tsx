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
    item.visibility === 'private' ? 'My private list' : item.category,
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const visibility = String(data.get('visibility')) as PackingVisibility
    onAddPackingItem({
      id: crypto.randomUUID(),
      label: String(data.get('label')),
      category: String(data.get('category')) || 'Other',
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
        title="Packing list"
        text="Shared with the group, or kept just for you."
        action={<button className="primary-button" onClick={() => setShowForm(true)}><Plus /> Item</button>}
      />
      <div className="progress-card">
        <div><strong>{progress}%</strong><span>already packed</span></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      </div>
      {showForm && (
        <EditorCard title="Add packing item" onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submit}>
            <Field label="What needs to come along?" name="label" required />
            <Field label="Category" name="category" defaultValue="Shared" />
            <label>
              Visibility
              <select name="visibility">
                <option value="shared">Shared</option>
                <option value="private">Only for me</option>
              </select>
            </label>
            <label>
              Assigned to
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
                  {group === 'My private list' ? <><Lock size={13} /> Private</> : 'Shared'}
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
                      aria-label={`${item.label} ${item.packed ? 'unpack' : 'pack'}`}
                    >
                      {item.packed && <Check />}
                    </button>
                    <span>{item.label}</span>
                    {assignee && <Avatar name={assignee.name} color={assignee.color} />}
                    <button
                      className="icon-button subtle"
                      onClick={() => onDeletePackingItem(item.id)}
                      aria-label={`Delete ${item.label}`}
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
