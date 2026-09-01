import { describe, expect, it } from 'vitest'
import type { Expense, Member } from '../types'
import { calculateSettlements, splitEvenly } from './settlements'

const members: Member[] = [
  { id: 'a', name: '[Person A]', role: 'owner', color: '#000' },
  { id: 'b', name: '[Person B]', role: 'member', color: '#000' },
  { id: 'c', name: '[Person C]', role: 'member', color: '#000' },
]

describe('splitEvenly', () => {
  it('distributes every cent deterministically', () => {
    expect(splitEvenly(100, ['c', 'a', 'b'])).toEqual([
      { memberId: 'a', amountCents: 34 },
      { memberId: 'b', amountCents: 33 },
      { memberId: 'c', amountCents: 33 },
    ])
  })
})

describe('calculateSettlements', () => {
  it('creates transfers that balance all expenses', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Hotel',
        amountCents: 30000,
        paidBy: 'a',
        date: '2026-09-01',
        shares: splitEvenly(30000, members.map((member) => member.id)),
      },
      {
        id: 'e2',
        description: 'Taxi',
        amountCents: 3000,
        paidBy: 'b',
        date: '2026-09-01',
        shares: splitEvenly(3000, members.map((member) => member.id)),
      },
    ]

    expect(calculateSettlements(members, expenses)).toEqual([
      { from: members[2], to: members[0], amountCents: 11000 },
      { from: members[1], to: members[0], amountCents: 8000 },
    ])
  })

  it('returns no transfers when everybody is settled', () => {
    expect(calculateSettlements(members, [])).toEqual([])
  })
})
