import { describe, expect, it } from 'vitest'
import { getGoogleMapsEmbedUrl, isGoogleMapsLink } from './maps'

describe('Google Maps links', () => {
  it('accepts full Google Maps links and creates an embed URL', () => {
    const link =
      'https://www.google.com/maps/search/?api=1&query=%5BBeispielort%5D'

    expect(isGoogleMapsLink(link)).toBe(true)
    expect(getGoogleMapsEmbedUrl(link)).toBe(
      'https://maps.google.com/maps?q=%5BBeispielort%5D&output=embed',
    )
  })

  it('rejects short links because their destination cannot be embedded reliably', () => {
    expect(isGoogleMapsLink('https://maps.app.goo.gl/placeholder')).toBe(false)
  })

  it('rejects non-Google locations', () => {
    expect(isGoogleMapsLink('https://example.com/maps/place')).toBe(false)
  })
})
