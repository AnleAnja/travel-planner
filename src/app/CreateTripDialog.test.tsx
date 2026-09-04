import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateTripDialog } from './CreateTripDialog'

describe('CreateTripDialog', () => {
  it('shows an error when creating the trip fails', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue({
      ok: false,
      error: 'The trip could not be created.',
    })

    render(<CreateTripDialog onClose={vi.fn()} onCreate={onCreate} />)

    await user.type(screen.getByLabelText('Your name'), 'Ada')
    await user.type(screen.getByLabelText('Trip name'), 'Lisbon')
    await user.type(screen.getByLabelText('Destination'), 'Portugal')
    await user.type(screen.getByLabelText('Start'), '2026-09-10')
    await user.type(screen.getByLabelText('End'), '2026-09-14')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('The trip could not be created.'),
    ).toBeInTheDocument()
    expect(onCreate).toHaveBeenCalled()
  })
})
