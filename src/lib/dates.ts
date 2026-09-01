const dayFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'short' })
const shortDateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
})

export function parseLocalDate(date: string) {
  return new Date(`${date}T12:00:00`)
}

export function formatDay(date: string) {
  return dayFormatter.format(parseLocalDate(date))
}

export function formatShortDate(date: string) {
  return shortDateFormatter.format(parseLocalDate(date))
}

export function formatTripCountdown(startsOn: string) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const days = Math.round(
    (parseLocalDate(startsOn).getTime() - today.getTime()) / 86_400_000,
  )

  if (days > 1) return `In ${days} Tagen geht es los`
  if (days === 1) return 'Morgen geht es los'
  if (days === 0) return 'Heute geht es los'
  return 'Die Reise hat bereits begonnen'
}
