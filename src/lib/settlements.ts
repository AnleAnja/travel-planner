import type { Expense, Member, Settlement } from '../types'

export function splitEvenly(amountCents: number, memberIds: string[]) {
  if (memberIds.length === 0) return []

  const baseShare = Math.floor(amountCents / memberIds.length)
  let remainder = amountCents % memberIds.length

  return [...memberIds]
    .sort()
    .map((memberId) => ({
      memberId,
      amountCents: baseShare + (remainder-- > 0 ? 1 : 0),
    }))
}

export function calculateSettlements(
  members: Member[],
  expenses: Expense[],
): Settlement[] {
  const balances = new Map(members.map((member) => [member.id, 0]))

  for (const expense of expenses) {
    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) ?? 0) + expense.amountCents,
    )
    for (const share of expense.shares) {
      balances.set(
        share.memberId,
        (balances.get(share.memberId) ?? 0) - share.amountCents,
      )
    }
  }

  const creditors = members
    .map((member) => ({ member, amount: balances.get(member.id) ?? 0 }))
    .filter(({ amount }) => amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const debtors = members
    .map((member) => ({ member, amount: -(balances.get(member.id) ?? 0) }))
    .filter(({ amount }) => amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const settlements: Settlement[] = []
  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]
    const amountCents = Math.min(creditor.amount, debtor.amount)

    settlements.push({
      from: debtor.member,
      to: creditor.member,
      amountCents,
    })

    creditor.amount -= amountCents
    debtor.amount -= amountCents
    if (creditor.amount === 0) creditorIndex += 1
    if (debtor.amount === 0) debtorIndex += 1
  }

  return settlements
}

export function formatMoney(amountCents: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amountCents / 100)
}
