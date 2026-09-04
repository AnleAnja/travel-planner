const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
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

  if (days > 1) return `Starts in ${days} days`
  if (days === 1) return 'Starts tomorrow'
  if (days === 0) return 'Starts today'
  return 'This trip has already started'
}
