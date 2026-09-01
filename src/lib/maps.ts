export function getGoogleMapsEmbedUrl(link: string) {
  try {
    const url = new URL(link)
    const queryFromUrl = url.searchParams.get('query') ?? url.searchParams.get('q')
    const coordinateMatch =
      link.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ??
      link.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/)
    const placeMatch = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/)
    const query =
      queryFromUrl ??
      (coordinateMatch
        ? `${coordinateMatch[1]},${coordinateMatch[2]}`
        : placeMatch
          ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
          : link)

    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
  } catch {
    return `https://maps.google.com/maps?q=${encodeURIComponent(link)}&output=embed`
  }
}

export function isGoogleMapsLink(link: string) {
  try {
    const url = new URL(link)
    return (
      url.protocol === 'https:' &&
      url.hostname.includes('google.') &&
      (url.hostname.startsWith('maps.') || url.pathname.startsWith('/maps'))
    )
  } catch {
    return false
  }
}
