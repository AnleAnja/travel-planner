import { describe, expect, it } from 'vitest'
import { mapJoinFailure, readInvitationCode } from './invitations'

describe('readInvitationCode', () => {
  it('reads a code from an array, object, or JSON string', () => {
    expect(readInvitationCode([{ code: 'ABC123' }])).toBe('ABC123')
    expect(readInvitationCode({ code: 'XYZ789' })).toBe('XYZ789')
    expect(readInvitationCode('{"code":"QWE456"}')).toBe('QWE456')
  })

  it('returns empty for missing or invalid payloads', () => {
    expect(readInvitationCode(null)).toBe('')
    expect(readInvitationCode(undefined)).toBe('')
    expect(readInvitationCode('not-json')).toBe('')
    expect(readInvitationCode({ token: 'nope' })).toBe('')
    expect(readInvitationCode([{ token: 'nope' }])).toBe('')
  })
})

describe('mapJoinFailure', () => {
  it('maps known statuses to safe English errors', () => {
    expect(mapJoinFailure(429)).toEqual({
      ok: false,
      error: 'Too many attempts. Please try again in a minute.',
    })
    expect(mapJoinFailure(401)).toEqual({
      ok: false,
      error: 'Sign-in failed. Please reload the page.',
    })
    expect(mapJoinFailure(404)).toMatchObject({
      ok: false,
      error: expect.stringMatching(/invalid or expired/i),
    })
    expect(mapJoinFailure(500, 'Invalid or expired invite.')).toMatchObject({
      ok: false,
      error: expect.stringMatching(/invalid or expired/i),
    })
  })

  it('never forwards raw SQL or PostgREST messages', () => {
    const result = mapJoinFailure(
      500,
      'function public.join_trip_with_code(text, text) does not exist',
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('Could not join. Check the code or ask for a new one.')
    expect(result.error).not.toMatch(/join_trip_with_code|does not exist/)
  })
})
