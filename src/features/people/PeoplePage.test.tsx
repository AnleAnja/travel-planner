import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PeoplePage } from './PeoplePage'
import type { Trip } from '../../types'

function tripFixture(inviteCode = 'ABC123'): Trip {
  return {
    id: 'trip-1',
    title: 'Test trip',
    destination: 'Lisbon',
    latitude: 0,
    longitude: 0,
    startsOn: '2026-09-01',
    endsOn: '2026-09-05',
    timezone: 'UTC',
    currency: 'EUR',
    inviteCode,
    members: [
      {
        id: 'member-current',
        name: 'Ada',
        role: 'owner',
        color: '#e86f51',
      },
    ],
    activities: [],
    bookings: [],
    packingItems: [],
    expenses: [],
    notes: [],
  }
}

describe('PeoplePage invite actions', () => {
  it('clears the busy state when creating a code throws', async () => {
    const user = userEvent.setup()
    const onCreateInvitation = vi.fn().mockRejectedValue(new Error('network'))

    render(
      <PeoplePage
        trip={tripFixture('')}
        currentMemberId="member-current"
        onCreateInvitation={onCreateInvitation}
        onUpdateDisplayName={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create code' }))

    expect(
      await screen.findByText('The invite code could not be created.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create code' })).not.toBeDisabled()
  })

  it('shows a copy error without disabling the actions', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    })

    render(
      <PeoplePage
        trip={tripFixture('ABC123')}
        currentMemberId="member-current"
        onCreateInvitation={vi.fn()}
        onUpdateDisplayName={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(
      await screen.findByText(
        'Could not copy the link. Your new code is still shown above.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy link' })).not.toBeDisabled()

    vi.unstubAllGlobals()
  })
})
