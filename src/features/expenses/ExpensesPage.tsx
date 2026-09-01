import { Banknote, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar, EditorCard, Field, FormActions, PageIntro } from '../../components/ui'
import { formatShortDate } from '../../lib/dates'
import { calculateSettlements, formatMoney, splitEvenly } from '../../lib/settlements'
import type { Expense, Trip } from '../../types'

export interface ExpensesPageProps {
  trip: Trip
  onAddExpense: (expense: Expense) => void
  onDeleteExpense: (id: string) => void
}

export function ExpensesPage({ trip, onAddExpense, onDeleteExpense }: ExpensesPageProps) {
  const [showForm, setShowForm] = useState(false)
  const [expenseError, setExpenseError] = useState('')
  const settlements = calculateSettlements(trip.members, trip.expenses)
  const total = trip.expenses.reduce((sum, expense) => sum + expense.amountCents, 0)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const amountCents = Math.round(Number(data.get('amount')) * 100)
    const participantIds = trip.members
      .filter((member) => data.get(`member-${member.id}`))
      .map((member) => member.id)
    if (!amountCents || participantIds.length === 0) return
    const manualShares = participantIds.map((memberId) => ({
      memberId,
      amountCents: Math.round(Number(data.get(`share-${memberId}`) || 0) * 100),
    }))
    const hasManualShares = manualShares.some((share) => share.amountCents > 0)
    if (
      hasManualShares &&
      manualShares.reduce((sum, share) => sum + share.amountCents, 0) !== amountCents
    ) {
      setExpenseError('Die individuellen Anteile müssen zusammen dem Gesamtbetrag entsprechen.')
      return
    }
    onAddExpense({
      id: crypto.randomUUID(),
      description: String(data.get('description')),
      amountCents,
      paidBy: String(data.get('paidBy')),
      date: String(data.get('date')),
      shares: hasManualShares ? manualShares : splitEvenly(amountCents, participantIds),
    })
    setExpenseError('')
    setShowForm(false)
  }

  return (
    <div className="page-content">
      <PageIntro
        title="Gemeinsame Ausgaben"
        text=""
        action={<button className="primary-button" onClick={() => setShowForm(true)}><Plus /> Ausgabe</button>}
      />
      <section className="balance-hero">
        <span>Gesamtausgaben</span>
        <strong>{formatMoney(total, trip.currency)}</strong>
        <small>{trip.expenses.length} Einträge</small>
      </section>
      {showForm && (
        <EditorCard title="Ausgabe erfassen" onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Beschreibung" name="description" required />
            <Field label="Betrag" name="amount" type="number" step="0.01" min="0.01" required />
            <label>
              Bezahlt von
              <select name="paidBy">
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>
            <Field label="Datum" name="date" type="date" defaultValue={trip.startsOn} required />
            <fieldset className="full-field participant-field">
              <legend>Gleichmäßig aufteilen zwischen</legend>
              {trip.members.map((member) => (
                <label key={member.id}>
                  <input type="checkbox" name={`member-${member.id}`} defaultChecked />
                  {member.name}
                </label>
              ))}
            </fieldset>
            <fieldset className="full-field manual-share-field">
              <legend>Individuelle Anteile (optional)</legend>
              <p>
                Leer lassen für eine gleichmäßige Aufteilung. Bei eigenen
                Beträgen muss die Summe dem Gesamtbetrag entsprechen.
              </p>
              <div>
                {trip.members.map((member) => (
                  <label key={member.id}>
                    {member.name}
                    <input type="number" name={`share-${member.id}`} min="0" step="0.01" placeholder="0,00" />
                  </label>
                ))}
              </div>
            </fieldset>
            {expenseError && <p className="form-error full-field" role="alert">{expenseError}</p>}
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </EditorCard>
      )}
      <div className="expenses-layout">
        <section className="card">
          <div className="section-heading"><h2>Ausgaben</h2><ReceiptText /></div>
          <div className="expense-list">
            {trip.expenses.map((expense) => {
              const payer = trip.members.find((member) => member.id === expense.paidBy)
              return (
                <div className="expense-row" key={expense.id}>
                  <div className="receipt-icon"><ReceiptText /></div>
                  <div>
                    <strong>{expense.description}</strong>
                    <span>{payer?.name} hat bezahlt · {formatShortDate(expense.date)}</span>
                  </div>
                  <strong>{formatMoney(expense.amountCents, trip.currency)}</strong>
                  <button
                    className="icon-button subtle"
                    onClick={() => onDeleteExpense(expense.id)}
                    aria-label={`${expense.description} löschen`}
                  >
                    <Trash2 />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
        <section className="card settlement-card">
          <div className="section-heading">
            <div><span className="eyebrow">Abrechnung</span><h2>So seid ihr quitt</h2></div>
            <Banknote />
          </div>
          {settlements.length === 0 ? (
            <p className="empty-state">Alles ausgeglichen.</p>
          ) : settlements.map((settlement) => (
            <div className="settlement" key={`${settlement.from.id}-${settlement.to.id}`}>
              <Avatar name={settlement.from.name} color={settlement.from.color} />
              <span><strong>{settlement.from.name}</strong> zahlt <strong>{settlement.to.name}</strong></span>
              <strong>{formatMoney(settlement.amountCents, trip.currency)}</strong>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
