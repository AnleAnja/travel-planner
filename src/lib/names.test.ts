import { describe, expect, it } from 'vitest'
import { isPlaceholderName, visibleMemberName } from './names'

describe('isPlaceholderName', () => {
  it('treats empty, legacy, and bracket names as placeholders', () => {
    expect(isPlaceholderName('')).toBe(true)
    expect(isPlaceholderName('   ')).toBe(true)
    expect(isPlaceholderName('Dein Name')).toBe(true)
    expect(isPlaceholderName('Your name')).toBe(true)
    expect(isPlaceholderName('Guest')).toBe(true)
    expect(isPlaceholderName('[Trip name]')).toBe(true)
    expect(isPlaceholderName('[Your name]')).toBe(true)
  })

  it('accepts real names', () => {
    expect(isPlaceholderName('Ada')).toBe(false)
    expect(isPlaceholderName('[Travel companion]')).toBe(false)
  })
})

describe('visibleMemberName', () => {
  it('shows Guest when the stored name is empty or a placeholder', () => {
    expect(visibleMemberName('')).toBe('Guest')
    expect(visibleMemberName('Your name')).toBe('Guest')
    expect(visibleMemberName('Ada')).toBe('Ada')
  })
})
